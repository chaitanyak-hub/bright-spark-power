import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Battery, Loader2 } from 'lucide-react';
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
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    batteryCostPerKwh: 250,
    solarCostPerKw: 20,
    cycleEffPct: 95,
    minThreshPct: 10,
    maxThreshPct: 90
  });

  useEffect(() => {
    if (siteId) {
      fetchSiteData();
    }
  }, [siteId]);

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

        if (statusResponse.isComplete) {
          if (statusResponse.status === 'Succeeded') {
            await downloadReport(processGuid);
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
        mpan: electricMeter.mpan_top_line || electricMeter.mpan_full,
        fromDateTime: "2025-04-01T00:00",
        toDateTime: "2026-03-31T00:00",
        availableCapacity: null,
        MIC: electricMeter.mic || 500,
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to={`/site/${siteId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Site Dashboard
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Battery Optimization</h1>
          <p className="text-muted-foreground text-lg">
            {site.companies?.name} - {site.address_line_1}, {site.postcode}
          </p>
        </div>

        {optimizationComplete && reportData ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Results</CardTitle>
                <CardDescription>
                  Battery optimization analysis completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{reportData.summary.minPayback} years</div>
                    <div className="text-sm text-muted-foreground">Minimum Payback</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{reportData.summary.recommendedBattery} kWh</div>
                    <div className="text-sm text-muted-foreground">Recommended Battery</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{reportData.summary.solarPV} kW</div>
                    <div className="text-sm text-muted-foreground">Solar PV</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-gray-300 p-2 text-left">Battery Capacity (kWh)</th>
                        <th className="border border-gray-300 p-2 text-left">Net Capacity (kWh)</th>
                        <th className="border border-gray-300 p-2 text-left">Battery Cost (£)</th>
                        <th className="border border-gray-300 p-2 text-left">Total Imports (£)</th>
                        <th className="border border-gray-300 p-2 text-left">Savings vs BAU (£)</th>
                        <th className="border border-gray-300 p-2 text-left">Payback (years)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.scenarios.map((scenario: any, index: number) => (
                        <tr key={index} className={scenario === reportData.bestScenario ? 'bg-green-50' : ''}>
                          <td className="border border-gray-300 p-2">{scenario['Gross Battery Capacity (kWh)']}</td>
                          <td className="border border-gray-300 p-2">{scenario['Net Battery Capacity (kWh)']}</td>
                          <td className="border border-gray-300 p-2">£{parseFloat(scenario['Cost of Battery (£)']).toLocaleString()}</td>
                          <td className="border border-gray-300 p-2">£{parseFloat(scenario['Total Cost of Imports (£)']).toLocaleString()}</td>
                          <td className="border border-gray-300 p-2">£{parseFloat(scenario['Savings vs BAU (£)']).toLocaleString()}</td>
                          <td className="border border-gray-300 p-2">{parseFloat(scenario['Payback (years)']).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button onClick={() => {
                    setResult(null);
                    setOptimizationComplete(false);
                    setReportData(null);
                  }} variant="outline">
                    Run Another Optimization
                  </Button>
                  <Button asChild>
                    <Link to={`/site/${siteId}`}>Back to Site Dashboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : result ? (
          <Card>
            <CardHeader>
              <CardTitle>Optimization Status</CardTitle>
              <CardDescription>
                Process GUID: {result.processGuid}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">{result.status}</h3>
                <p className="text-muted-foreground mb-6">{result.message}</p>
                {polling && (
                  <p className="text-sm text-muted-foreground">
                    Checking status automatically...
                  </p>
                )}
                <Button onClick={() => setResult(null)} variant="outline" className="mt-4">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Battery className="mr-2 h-5 w-5" />
                Battery & Solar Configuration
              </CardTitle>
              <CardDescription>
                Configure parameters for battery optimization analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="mpan">MPAN (readonly)</Label>
                    <Input
                      id="mpan"
                      value={electricMeter.mpan_top_line || electricMeter.mpan_full}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="mic">Maximum Import Capacity (kW)</Label>
                    <Input
                      id="mic"
                      type="number"
                      value={electricMeter.mic || 500}
                      disabled
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

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Analysis Parameters</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>• Analysis Period: April 2025 - March 2026</div>
                    <div>• Battery Capacity Range: 500 - 1200 kWh (100 kWh increments)</div>
                    <div>• Solar PV: 0 kW (battery-only analysis)</div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={optimizing}
                >
                  {optimizing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Optimization...
                    </>
                  ) : (
                    <>
                      <Battery className="mr-2 h-4 w-4" />
                      Run Battery Optimization
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BatteryOptimization;