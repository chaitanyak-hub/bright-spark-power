import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, Battery, TrendingUp, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SiteDashboard = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState<any>(null);
  const [meters, setMeters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

      const { data: metersData, error: metersError } = await supabase
        .from('meters')
        .select('*')
        .eq('site_id', siteId);

      if (metersError) throw metersError;

      setSite(siteData);
      setMeters(metersData || []);
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

  const handleOptimizeClick = () => {
    if (site?.loa_status !== 'Verified') {
      toast({
        title: "Authorization Required",
        description: "Letter of Authority must be verified before running optimizations",
        variant: "destructive"
      });
      return;
    }
    navigate(`/site/${siteId}/optimize`);
  };

  const handleAutoValidateLoA = async () => {
    try {
      const { error } = await supabase
        .from('sites')
        .update({ loa_status: 'Verified' })
        .eq('id', siteId);

      if (error) throw error;

      setSite(prev => ({ ...prev, loa_status: 'Verified' }));
      
      toast({
        title: "Success",
        description: "LoA automatically validated for testing purposes",
      });
    } catch (error) {
      console.error('Error validating LoA:', error);
      toast({
        title: "Error",
        description: "Failed to validate LoA",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="text-center">Loading site data...</div>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="text-center">Site not found</div>
        </div>
      </div>
    );
  }

  const electricMeter = meters.find(m => m.meter_type === 'ELEC');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{site.companies?.name}</h1>
              <p className="text-muted-foreground text-lg">
                {site.address_line_1}, {site.postcode}
              </p>
              <div className="mt-2">
                <Badge 
                  variant={site.loa_status === 'Verified' ? 'default' : 'secondary'}
                  className={
                    site.loa_status === 'Verified' 
                      ? 'bg-green-100 text-green-700' 
                      : site.loa_status === 'Failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }
                >
                  LoA: {site.loa_status}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              {site.loa_status !== 'Verified' && (
                <Button 
                  onClick={handleAutoValidateLoA}
                  variant="outline"
                  className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                >
                  Auto-Validate LoA (Testing)
                </Button>
              )}
              <Button 
                onClick={handleOptimizeClick}
                disabled={site.loa_status !== 'Verified'}
                className="bg-primary hover:bg-primary/90"
              >
                <Battery className="mr-2 h-4 w-4" />
                Run Battery Optimization
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Electricity Usage</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,450 kWh</div>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
              <div className="text-sm font-medium text-green-600">£3,735</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gas Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,200 kWh</div>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
              <div className="text-sm font-medium text-blue-600">£574</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
              <Battery className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£1,240</div>
              <p className="text-xs text-muted-foreground">Estimated annual</p>
              <div className="text-sm font-medium text-primary">33% reduction</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
              <CardDescription>Property and energy details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Contact:</span>
                  <div>{site.contacts?.first_name} {site.contacts?.last_name}</div>
                  <div className="text-muted-foreground">{site.contacts?.email}</div>
                </div>
                <div>
                  <span className="font-medium">Property Type:</span>
                  <div>{site.floors} floors</div>
                  <div className="text-muted-foreground">{site.area_m2} m²</div>
                </div>
                <div>
                  <span className="font-medium">Year Built:</span>
                  <div>{site.year_built}</div>
                  <div className="text-muted-foreground">Listed: {site.listed_grade}</div>
                </div>
                <div>
                  <span className="font-medium">Energy Suppliers:</span>
                  <div>Elec: {site.elec_supplier}</div>
                  <div>Gas: {site.gas_supplier}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meter Details</CardTitle>
              <CardDescription>Electricity and gas meter information</CardDescription>
            </CardHeader>
            <CardContent>
              {meters.length > 0 ? (
                <div className="space-y-4">
                  {meters.map((meter) => (
                    <div key={meter.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium flex items-center">
                            {meter.meter_type === 'ELEC' ? (
                              <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                            ) : (
                              <TrendingUp className="mr-2 h-4 w-4 text-blue-500" />
                            )}
                            {meter.meter_type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {meter.meter_type === 'ELEC' 
                              ? meter.mpan_top_line || meter.mpan_full
                              : meter.mprn
                            }
                          </div>
                        </div>
                        {meter.meter_type === 'ELEC' && meter.mic && (
                          <div className="text-right">
                            <div className="text-sm font-medium">MIC: {meter.mic}kW</div>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  No meters configured
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {site.loa_status !== 'Verified' && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-yellow-800 font-medium mb-2">
                  Solar Recommendations & Battery Optimization Unavailable
                </div>
                <p className="text-yellow-700 text-sm">
                  Letter of Authority verification is required to access optimization features.
                  Status: {site.loa_status}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SiteDashboard;