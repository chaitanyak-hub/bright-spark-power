import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Battery, Loader2, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const BatteryOptimization = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState<any>(null);
  const [electricMeter, setElectricMeter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [polling, setPolling] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [processGuid, setProcessGuid] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [previousOptimizations, setPreviousOptimizations] = useState<any[]>([]);
  const [selectedOptimization, setSelectedOptimization] = useState<any>(null);
  const [showPreviousResults, setShowPreviousResults] = useState(false);
  const [statusDetails, setStatusDetails] = useState<string>('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    batteryCostPerKwh: 250,
    solarCostPerKw: 20,
    cycleEffPct: 95,
    minThreshPct: 10,
    maxThreshPct: 90,
    mpan: '',
    mic: 500
  });

  useEffect(() => {
    if (siteId) {
      fetchSiteData();
      fetchPreviousOptimizations();
    }
  }, [siteId]);

  // Update form data when electric meter changes
  useEffect(() => {
    if (electricMeter) {
      setFormData(prev => ({
        ...prev,
        mpan: electricMeter.mpan_top_line || electricMeter.mpan_full || '',
        mic: electricMeter.mic || 500
      }));
    }
  }, [electricMeter]);

  const fetchSiteData = async () => {
    try {
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select(`
          *,
          companies(name),
          contacts(first_name, last_name, email)
        `)
        .eq('id', siteId)
        .single();

      if (siteError) throw siteError;

      if (siteData.loa_status !== 'Verified') {
        toast({
          title: "Access Denied",
          description: "Letter of Authority must be verified to access this feature",
          variant: "destructive"
        });
        navigate(`/site/${siteId}`);
        return;
      }

      const { data: metersData, error: metersError } = await supabase
        .from('meters')
        .select('*')
        .eq('site_id', siteId)
        .eq('meter_type', 'ELEC');

      if (metersError) throw metersError;

      setSite(siteData);
      setElectricMeter(metersData?.[0]);
    } catch (error) {
      console.error('Error fetching site data:', error);
      toast({
        title: "Error",
        description: "Failed to load site data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousOptimizations = async () => {
    if (!siteId) return;
    
    try {
      const { data, error } = await supabase
        .from('optimization_results')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPreviousOptimizations(data || []);
    } catch (error) {
      console.error('Error fetching previous optimizations:', error);
    }
  };

  const saveOptimizationResults = async (processGuid: string, reportData: any) => {
    if (!siteId) return;

    try {
      const { error } = await supabase
        .from('optimization_results')
        .insert({
          site_id: siteId,
          process_guid: processGuid,
          mpan: formData.mpan || electricMeter?.mpan_top_line || electricMeter?.mpan_full,
          mic: formData.mic,
          battery_cost_per_kwh: formData.batteryCostPerKwh,
          solar_cost_per_kw: formData.solarCostPerKw,
          cycle_eff_pct: formData.cycleEffPct,
          min_thresh_pct: formData.minThreshPct,
          max_thresh_pct: formData.maxThreshPct,
          scenarios_data: reportData.scenarios,
          best_scenario: reportData.bestScenario,
          summary_data: reportData.summary,
          status: 'Completed'
        });

      if (error) throw error;
      
      // Refresh the previous optimizations list
      fetchPreviousOptimizations();
    } catch (error) {
      console.error('Error saving optimization results:', error);
    }
  };

  const recalculateBusinessCase = (optimization: any) => {
    // Recalculate scenarios with new cost parameters
    const updatedScenarios = optimization.scenarios_data.map((scenario: any) => {
      const grossCapacity = parseFloat(scenario['Gross Battery Capacity (kWh)']);
      const newBatteryCost = grossCapacity * formData.batteryCostPerKwh;
      const savings = parseFloat(scenario['Savings compared to BAU (£)']);
      const newPayback = savings > 0 ? (newBatteryCost / savings).toFixed(2) : '999';

      return {
        ...scenario,
        'Cost of Battery (£)': newBatteryCost.toString(),
        'Payback (years)': newPayback
      };
    });

    // Find new best scenario
    let bestScenario = updatedScenarios[0];
    let minPayback = parseFloat(bestScenario['Payback (years)']) || Infinity;

    updatedScenarios.forEach(scenario => {
      const payback = parseFloat(scenario['Payback (years)']) || Infinity;
      if (payback < minPayback) {
        minPayback = payback;
        bestScenario = scenario;
      }
    });

    const updatedReportData = {
      scenarios: updatedScenarios,
      bestScenario,
      summary: {
        ...optimization.summary_data,
        minPayback: minPayback.toFixed(2),
        recommendedBattery: bestScenario?.['Gross Battery Capacity (kWh)'] || '0'
      }
    };

    setReportData(updatedReportData);
    setOptimizationComplete(true);
    setShowPreviousResults(false);
  };

  const pollOptimizationStatus = async (processGuid: string) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes with 2-second intervals
    
    const poll = async () => {
      try {
        const { data: statusResponse, error: statusError } = await supabase.functions.invoke('check-optimization-logs', {
          body: { processGuid }
        });

        if (statusError) throw statusError;

        console.log('Polling status:', statusResponse);

        // Update status details from first log entry
        if (statusResponse.logs && statusResponse.logs.length > 0) {
          const firstLog = statusResponse.logs[0];
          if (firstLog.details) {
            setStatusDetails(firstLog.details);
          }
        }

        if (statusResponse.isComplete) {
          if (statusResponse.status === 'Succeeded') {
            await fetchSolarPVReport(processGuid);
          } else {
            setResult(prev => ({
              ...prev,
              status: 'Failed',
              message: 'Optimization process failed. Please try again.'
            }));
            setOptimizationComplete(true);
          }
          setPolling(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Exponential backoff: start at 2s, max at 10s
          const delay = Math.min(2000 * Math.pow(1.1, attempts), 10000);
          setTimeout(poll, delay);
        } else {
          setResult(prev => ({
            ...prev,
            status: 'Timeout',
            message: 'Optimization is taking longer than expected. Please check back later.'
          }));
          setPolling(false);
        }
      } catch (error) {
        console.error('Error polling status:', error);
        setPolling(false);
        setResult(prev => ({
          ...prev,
          status: 'Error',
          message: 'Failed to check optimization status'
        }));
      }
    };

    poll();
  };

  const downloadReport = async (processGuid: string) => {
    try {
      const { data: reportResponse, error: reportError } = await supabase.functions.invoke('download-optimization-report', {
        body: {
          logGuid: processGuid,
          solarPvUnitCost: formData.solarCostPerKw,
          batteryUnitCost: formData.batteryCostPerKwh
        }
      });

      if (reportError) throw reportError;

      if (reportResponse.csvContent) {
        const parsedData = parseCSVReport(reportResponse.csvContent);
        setReportData(parsedData);
        setOptimizationComplete(true);
        
        toast({
          title: "Optimization Complete",
          description: "Battery optimization analysis completed successfully!",
        });
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Report Error",
        description: "Failed to download optimization report",
        variant: "destructive"
      });
    }
  };

  const fetchSolarPVReport = async (processGuid: string) => {
    try {
      const { data: reportResponse, error: reportError } = await supabase.functions.invoke('get-solar-pv-report', {
        body: { 
          logGuid: processGuid,
          solarPvUnitCost: formData.solarCostPerKw,
          batteryUnitCost: formData.batteryCostPerKwh
        }
      });

      if (reportError) throw reportError;

      console.log('Solar PV report response:', reportResponse);

      if (reportResponse.success && reportResponse.csvContent) {
        // Parse the solar PV CSV data
        const solarPVData = parseSolarPVReport(reportResponse.csvContent);
        console.log('Parsed Solar PV data:', solarPVData);
        
        // Update the report data with solar PV data and mark as complete
        setReportData({
          solarPVData,
          scenarios: solarPVData.scenarios,
          bestScenario: solarPVData.bestScenario,
          summary: solarPVData.summary
        });
        
        // Save optimization results to database
        await saveOptimizationResults(processGuid, {
          scenarios: solarPVData.scenarios,
          bestScenario: solarPVData.bestScenario,
          summary: solarPVData.summary
        });
        
        // Mark optimization as complete to show results
        setOptimizationComplete(true);
        
        toast({
          title: "Optimization Complete",
          description: "Solar PV battery optimization analysis completed successfully!",
        });
      } else {
        throw new Error('Failed to fetch solar PV report');
      }
    } catch (error) {
      console.error('Error fetching solar PV report:', error);
      toast({
        title: "Error",
        description: "Failed to fetch optimization report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadDetailedAnalysis = async () => {
    if (!processGuid) return;

    try {
      setIsDownloading(true);
      const { data, error } = await supabase.functions.invoke('download-detailed-analysis', {
        body: { logGuid: processGuid }
      });

      if (error) throw error;

      if (data.success && data.csvContent) {
        // Create and download the CSV file
        const blob = new Blob([data.csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detailed-analysis-${processGuid}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Download Complete",
          description: "Detailed analysis CSV has been downloaded successfully!",
        });
      } else {
        throw new Error('Failed to download detailed analysis');
      }
    } catch (error) {
      console.error('Error downloading detailed analysis:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download detailed analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const parseCSVReport = (csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim();
      });
      data.push(row);
    }

    // Find best scenario (minimum payback or maximum savings)
    let bestScenario = data[0];
    let minPayback = parseFloat(bestScenario['Payback (years)']) || Infinity;

    data.forEach(row => {
      const payback = parseFloat(row['Payback (years)']) || Infinity;
      if (payback < minPayback) {
        minPayback = payback;
        bestScenario = row;
      }
    });

    return {
      scenarios: data,
      bestScenario,
      summary: {
        minPayback: minPayback.toFixed(2),
        recommendedBattery: bestScenario['Gross Battery Capacity (kWh)'],
        solarPV: '0.0', // As per requirements
        totalCostReduction: bestScenario['Total Cost of Imports (£)']
      }
    };
  };

  const parseSolarPVReport = (csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    const data: any = {};
    const scenarios: any[] = [];

    lines.forEach(line => {
      const parts = line.split(',');
      if (parts.length > 1) {
        const label = parts[0].replace(/"/g, '').trim();
        const values = parts.slice(1).map(val => val.replace(/"/g, '').trim());
        data[label] = values;
      }
    });

    // Extract scenario data
    const grossBatteryCapacities = data['Gross Battery Capacity kWh'] || [];
    const totalCosts = data['Total Cost of Imports'] || [];
    const savings = data['Savings compared to BAU'] || [];
    const paybackYears = data['Payback years'] || [];
    const batteryCosts = data['Cost of Battery'] || [];

    // Create scenarios array
    for (let i = 0; i < grossBatteryCapacities.length; i++) {
      if (grossBatteryCapacities[i] && totalCosts[i]) {
        scenarios.push({
          'Gross Battery Capacity (kWh)': grossBatteryCapacities[i],
          'Total Cost of Imports (£)': totalCosts[i],
          'Savings compared to BAU (£)': savings[i] || '0',
          'Payback (years)': paybackYears[i] || '0',
          'Cost of Battery (£)': batteryCosts[i] || '0'
        });
      }
    }

    // Find best scenario (minimum payback)
    let bestScenario = scenarios[0];
    let minPayback = parseFloat(data['Minimum Payback']?.[0] || '999');

    scenarios.forEach(scenario => {
      const payback = parseFloat(scenario['Payback (years)']) || Infinity;
      if (payback < minPayback) {
        minPayback = payback;
        bestScenario = scenario;
      }
    });

    return {
      scenarios,
      bestScenario,
      summary: {
        minPayback: data['Minimum Payback']?.[0] || minPayback.toFixed(2),
        recommendedBattery: data['Battery']?.[0] || bestScenario?.['Gross Battery Capacity (kWh)'] || '0',
        solarPV: data['Solar PV']?.[0] || '0.0',
        totalCostImports: data['Total Cost of Imports']?.[0] || '0',
        maxChargingRate: data['Maximum Charging Rate kWh']?.[0] || '0',
        maxDischargingRate: data['Maximum Discharging Rate kWh']?.[0] || '0'
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!electricMeter) {
      toast({
        title: "Error",
        description: "No electricity meter found for this site",
        variant: "destructive"
      });
      return;
    }

    setOptimizing(true);
    
    try {
      // Prepare the request body matching the API requirements
      const requestBody = {
        mpan: formData.mpan || electricMeter.mpan_top_line || electricMeter.mpan_full,
        fromDateTime: "2025-04-01T00:00",
        toDateTime: "2026-03-31T00:00",
        availableCapacity: null,
        MIC: formData.mic,
        cycleEff: formData.cycleEffPct / 100, // Convert percentage to decimal
        minThresh: formData.minThreshPct / 100,
        maxThresh: formData.maxThreshPct / 100,
        batteryGross: 500.0,
        startKwp: 0.0,
        incrementKwp: 0.0,
        endKwp: 0.0,
        startKwh: 500.0,
        incrementKwh: 100.0,
        endKwh: 1200.0,
        generationMetaData: {
          panelCount: null,
          panelCapacityWatts: 500,
          installationCostPerWatt: 1.0,
          dcToAcDerate: 0.85,
          installationLifeSpan: 30,
          efficiencyDepreciationFactor: 0.995
        }
      };

      // Save optimization run to database
      const { data: optimizerRun, error: saveError } = await supabase
        .from('optimiser_runs')
        .insert({
          site_id: siteId,
          mpan: requestBody.mpan,
          mic: requestBody.MIC,
          battery_cost_per_kwh: formData.batteryCostPerKwh,
          solar_cost_per_kw: formData.solarCostPerKw,
          cycle_eff_pct: formData.cycleEffPct,
          min_thresh_pct: formData.minThreshPct,
          max_thresh_pct: formData.maxThreshPct,
          status: 'Submitted'
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Call the battery optimizer API
      const { data: apiResponse, error: apiError } = await supabase.functions.invoke('battery-optimizer', {
        body: requestBody
      });

      if (apiError) throw apiError;

      if (apiResponse?.['process-guid']) {
        const processGuid = apiResponse['process-guid'];
        
        // Update with process GUID
        await supabase
          .from('optimiser_runs')
          .update({ 
            process_guid: processGuid,
            status: 'Processing'
          })
          .eq('id', optimizerRun.id);

        toast({
          title: "Optimization Started",
          description: `Processing request... GUID: ${processGuid}`,
        });

        setResult({
          processGuid,
          status: 'Processing',
          message: 'Your optimization request is being processed. This may take a few minutes.'
        });

        setProcessGuid(processGuid);

        // Start polling for completion
        pollOptimizationStatus(processGuid);
      } else {
        throw new Error('No process GUID received from API');
      }
    } catch (error) {
      console.error('Error running optimization:', error);
      toast({
        title: "Error",
        description: "Failed to run battery optimization",
        variant: "destructive"
      });
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!site || !electricMeter) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="text-center">
            <p>Site or electricity meter not found</p>
            <Button asChild className="mt-4">
              <Link to={`/site/${siteId}`}>Back to Site</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header Section */}
      <section className="bg-background border-b">
        <div className="container mx-auto px-6 py-8">
          <Button variant="ghost" asChild className="mb-6 hover:bg-primary/10">
            <Link to={`/site/${siteId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Site Dashboard
            </Link>
          </Button>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Battery className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Battery Optimization</h1>
                <p className="text-muted-foreground text-lg">
                  {site.companies?.name} - {site.address_line_1}, {site.postcode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Previous Optimizations Section */}
        {previousOptimizations.length > 0 && !optimizationComplete && !result && (
          <Card className="shadow-card border-0 mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Previous Optimizations</CardTitle>
                  <CardDescription>View and adjust cost parameters for previous optimization runs</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreviousResults(!showPreviousResults)}
                >
                  {showPreviousResults ? 'Hide' : 'Show'} Previous Results
                </Button>
              </div>
            </CardHeader>
            {showPreviousResults && (
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-muted">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">MPAN</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">MIC</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Battery Cost</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Best Payback</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previousOptimizations.map((optimization) => (
                        <tr key={optimization.id} className="border-b border-muted/50 hover:bg-muted/20 transition-colors">
                          <td className="py-4 px-4">{new Date(optimization.created_at).toLocaleDateString()}</td>
                          <td className="py-4 px-4 font-mono text-sm">{optimization.mpan}</td>
                          <td className="py-4 px-4">{optimization.mic} kW</td>
                          <td className="py-4 px-4">£{optimization.battery_cost_per_kwh}/kWh</td>
                          <td className="py-4 px-4 font-bold text-primary">{optimization.summary_data.minPayback} years</td>
                          <td className="py-4 px-4">
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedOptimization(optimization);
                                // Update form data with optimization parameters
                                setFormData({
                                  batteryCostPerKwh: optimization.battery_cost_per_kwh,
                                  solarCostPerKw: optimization.solar_cost_per_kw,
                                  cycleEffPct: optimization.cycle_eff_pct,
                                  minThreshPct: optimization.min_thresh_pct,
                                  maxThreshPct: optimization.max_thresh_pct,
                                  mpan: optimization.mpan,
                                  mic: optimization.mic
                                });
                                recalculateBusinessCase(optimization);
                              }}
                            >
                              View & Adjust
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        )}


        {optimizationComplete && reportData ? (
          <div className="space-y-8">
            {/* Solar PV Report Analysis */}
            {reportData.solarPVData && (
              <Card className="shadow-card border-0 bg-gradient-to-r from-orange-50 to-amber-50">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Zap className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-orange-800">Solar PV Report Analysis</CardTitle>
                      <CardDescription className="text-orange-700">
                        Detailed breakdown of battery scenarios with optimal payback periods
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Key Metrics Summary */}
                  <div className="grid gap-4 md:grid-cols-4 mb-8">
                    <div className="text-center p-4 bg-white/70 rounded-xl shadow-sm">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {reportData.solarPVData.summary.minPayback} years
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">Minimum Payback</div>
                    </div>
                    <div className="text-center p-4 bg-white/70 rounded-xl shadow-sm">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {reportData.solarPVData.summary.recommendedBattery} kWh
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">Optimal Battery Size</div>
                    </div>
                    <div className="text-center p-4 bg-white/70 rounded-xl shadow-sm">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {reportData.solarPVData.summary.maxChargingRate} kWh
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">Max Charging Rate</div>
                    </div>
                    <div className="text-center p-4 bg-white/70 rounded-xl shadow-sm">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {Math.abs(parseFloat(reportData.solarPVData.summary.maxDischargingRate)).toFixed(1)} kWh
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">Max Discharging Rate</div>
                    </div>
                  </div>

                   {/* Detailed Scenarios Table */}
                   <Card className="shadow-sm border-0 bg-white/50">
                     <CardHeader>
                       <div className="flex justify-between items-center">
                         <div>
                           <CardTitle className="text-lg">Battery Scenarios Analysis</CardTitle>
                           <CardDescription>
                             All scenarios compared with the lowest payback period highlighted
                           </CardDescription>
                         </div>
                         <Button 
                           onClick={downloadDetailedAnalysis}
                           disabled={isDownloading}
                           className="bg-orange-600 hover:bg-orange-700 text-white"
                         >
                           {isDownloading ? (
                             <>
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                               Downloading...
                             </>
                           ) : (
                             <>
                               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                               </svg>
                               Download Detailed Analysis CSV
                             </>
                           )}
                         </Button>
                       </div>
                     </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-muted">
                              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Battery Capacity</th>
                              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Battery Cost</th>
                              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Total Cost Imports</th>
                              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Savings vs BAU</th>
                              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Payback Period</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.solarPVData.scenarios.map((scenario: any, index: number) => {
                              const isOptimal = parseFloat(scenario['Payback (years)']) === parseFloat(reportData.solarPVData.summary.minPayback);
                              return (
                                <tr 
                                  key={index} 
                                  className={`border-b border-muted/50 hover:bg-muted/20 transition-colors ${
                                    isOptimal ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 ring-2 ring-green-100' : ''
                                  }`}
                                >
                                  <td className={`py-4 px-4 font-medium ${isOptimal ? 'text-green-800' : ''}`}>
                                    {scenario['Gross Battery Capacity (kWh)']} kWh
                                    {isOptimal && (
                                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                        OPTIMAL
                                      </span>
                                    )}
                                  </td>
                                  <td className={`py-4 px-4 ${isOptimal ? 'font-bold text-green-800' : ''}`}>
                                    £{parseFloat(scenario['Cost of Battery (£)']).toLocaleString()}
                                  </td>
                                  <td className={`py-4 px-4 ${isOptimal ? 'font-bold text-green-800' : ''}`}>
                                    £{parseFloat(scenario['Total Cost of Imports (£)']).toLocaleString()}
                                  </td>
                                  <td className={`py-4 px-4 font-medium ${isOptimal ? 'text-green-600 font-bold' : 'text-green-600'}`}>
                                    £{parseFloat(scenario['Savings compared to BAU (£)']).toLocaleString()}
                                  </td>
                                  <td className={`py-4 px-4 font-bold ${isOptimal ? 'text-green-600 text-lg' : 'text-primary'}`}>
                                    {parseFloat(scenario['Payback (years)']).toFixed(2)} years
                                    {isOptimal && (
                                      <span className="ml-2 text-green-600">
                                        🏆
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-card border-0 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Battery className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-green-800">Optimization Complete!</CardTitle>
                    <CardDescription className="text-green-700">
                      Your battery optimization analysis has been completed successfully
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                  <div className="text-center p-6 bg-white/70 rounded-2xl shadow-card">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">{reportData.summary.minPayback} years</div>
                    <div className="text-sm font-medium text-muted-foreground">Minimum Payback Period</div>
                  </div>
                  <div className="text-center p-6 bg-white/70 rounded-2xl shadow-card">
                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Battery className="h-8 w-8 text-secondary" />
                    </div>
                    <div className="text-3xl font-bold text-secondary mb-2">{reportData.summary.recommendedBattery} kWh</div>
                    <div className="text-sm font-medium text-muted-foreground">Recommended Battery Capacity</div>
                  </div>
                  <div className="text-center p-6 bg-white/70 rounded-2xl shadow-card">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">{reportData.summary.solarPV} kW</div>
                    <div className="text-sm font-medium text-muted-foreground">Solar PV Capacity</div>
                  </div>
                </div>

                <Card className="shadow-card border-0 bg-white/50">
                  <CardHeader>
                    <CardTitle className="text-xl">Detailed Analysis Results</CardTitle>
                    <CardDescription>Comparison of different battery capacity scenarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-muted">
                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Battery Capacity</th>
                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Net Capacity</th>
                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Battery Cost</th>
                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Total Imports</th>
                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Savings vs BAU</th>
                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Payback Period</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.scenarios.map((scenario: any, index: number) => (
                            <tr key={index} className={`border-b border-muted/50 hover:bg-muted/20 transition-colors ${
                              scenario === reportData.bestScenario ? 'bg-green-50 border-green-200' : ''
                            }`}>
                              <td className="py-4 px-4 font-medium">{scenario['Gross Battery Capacity (kWh)']} kWh</td>
                              <td className="py-4 px-4">{scenario['Net Battery Capacity (kWh)']} kWh</td>
                              <td className="py-4 px-4 font-medium">£{parseFloat(scenario['Cost of Battery (£)']).toLocaleString()}</td>
                              <td className="py-4 px-4">£{parseFloat(scenario['Total Cost of Imports (£)']).toLocaleString()}</td>
                              <td className="py-4 px-4 font-medium text-green-600">£{parseFloat(scenario['Savings vs BAU (£)']).toLocaleString()}</td>
                              <td className="py-4 px-4 font-bold text-primary">{parseFloat(scenario['Payback (years)']).toFixed(2)} years</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => {
                      setResult(null);
                      setOptimizationComplete(false);
                      setReportData(null);
                    }} 
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Battery className="mr-2 h-4 w-4" />
                    Run Another Optimization
                  </Button>
                  <Button asChild size="lg" className="btn-primary flex-1">
                    <Link to={`/site/${siteId}`}>
                      Back to Site Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : result ? (
          <Card className="shadow-card border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-blue-800">Processing Optimization</CardTitle>
                  <CardDescription className="text-blue-700">
                    Process ID: {result.processGuid}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-blue-800">{result.status}</h3>
                <p className="text-blue-700 mb-8 text-lg max-w-md mx-auto">{result.message}</p>
                {polling && (
                  <div className="bg-white/50 rounded-lg p-4 mb-6 max-w-lg mx-auto">
                    <p className="text-sm text-blue-600 font-medium mb-2">
                      ⚡ Automatically checking status...
                    </p>
                    {statusDetails && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md border-l-4 border-blue-300">
                        <p className="text-sm text-blue-800 font-medium">Status Details:</p>
                        <p className="text-sm text-blue-700 mt-1">{statusDetails}</p>
                      </div>
                    )}
                  </div>
                )}
                <Button onClick={() => setResult(null)} variant="outline" size="lg" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  Cancel Process
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card border-0">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Battery className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Battery & Solar Configuration</CardTitle>
                  <CardDescription className="text-base">
                    {selectedOptimization ? 'Viewing previous optimization - adjust costs to see updated business case' : 'Configure parameters for comprehensive battery optimization analysis'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="mpan">MPAN</Label>
                    <Input
                      id="mpan"
                      value={formData.mpan || electricMeter.mpan_top_line || electricMeter.mpan_full}
                      onChange={(e) => setFormData(prev => ({ ...prev, mpan: e.target.value }))}
                      placeholder="Enter MPAN number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mic">Maximum Import Capacity (kW)</Label>
                    <Input
                      id="mic"
                      type="number"
                      value={formData.mic}
                      onChange={(e) => setFormData(prev => ({ ...prev, mic: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter MIC value"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="batteryCost">Battery Cost per kWh (£)</Label>
                    <Input
                      id="batteryCost"
                      type="number"
                      step="0.01"
                      value={formData.batteryCostPerKwh}
                      onChange={(e) => setFormData(prev => ({ ...prev, batteryCostPerKwh: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="solarCost">Solar Cost per kW (£)</Label>
                    <Input
                      id="solarCost"
                      type="number"
                      step="0.01"
                      value={formData.solarCostPerKw}
                      onChange={(e) => setFormData(prev => ({ ...prev, solarCostPerKw: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="cycleEff">Battery Cycle Efficiency (%)</Label>
                    <Input
                      id="cycleEff"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.cycleEffPct}
                      onChange={(e) => setFormData(prev => ({ ...prev, cycleEffPct: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minThresh">Min Battery Threshold (%)</Label>
                    <Input
                      id="minThresh"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.minThreshPct}
                      onChange={(e) => setFormData(prev => ({ ...prev, minThreshPct: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxThresh">Max Battery Threshold (%)</Label>
                    <Input
                      id="maxThresh"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.maxThreshPct}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxThreshPct: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <Card className="bg-gradient-to-r from-muted/30 to-muted/50 border-muted">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-4 text-lg">Analysis Parameters</h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="text-sm">Analysis Period: April 2025 - March 2026</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                        <span className="text-sm">Battery Range: 500 - 1200 kWh (100 kWh steps)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <span className="text-sm">Solar PV: 0 kW (battery-only analysis)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={optimizing}
                    className="flex-1"
                  >
                    {optimizing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Optimization...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Run Battery Optimization
                      </>
                    )}
                  </Button>
                  {selectedOptimization && (
                    <Button 
                      type="button"
                      onClick={() => recalculateBusinessCase(selectedOptimization)}
                      size="lg"
                      variant="outline"
                      className="flex-1"
                    >
                      Update Business Case
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BatteryOptimization;