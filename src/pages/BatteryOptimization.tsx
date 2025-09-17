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
  const [result, setResult] = useState<any>(null);
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

      if (apiResponse?.responseData?.['process-guid']) {
        const processGuid = apiResponse.responseData['process-guid'];
        
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

        {!result ? (
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
        ) : (
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
                <Button onClick={() => setResult(null)} variant="outline">
                  Run Another Optimization
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BatteryOptimization;