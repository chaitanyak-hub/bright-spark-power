import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, Battery, TrendingUp, Settings, Building2, ArrowRight } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto p-6">
          <div className="text-center py-20">
            <div className="animate-pulse text-lg text-muted-foreground">Loading site data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto p-6">
          <div className="text-center py-20">Site not found</div>
        </div>
      </div>
    );
  }

  const electricMeter = meters.find(m => m.meter_type === 'ELEC');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header Section */}
      <section className="bg-background border-b">
        <div className="container mx-auto px-6 py-8">
          <Button variant="ghost" asChild className="mb-6 hover:bg-primary/10">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">{site.companies?.name}</h1>
                  <p className="text-muted-foreground text-lg">
                    {site.address_line_1}, {site.postcode}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Badge 
                  variant="outline"
                  className={`text-sm px-3 py-1 ${
                    site.loa_status === 'Verified' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : site.loa_status === 'Failed'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}
                >
                  LoA Status: {site.loa_status}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {site.loa_status !== 'Verified' && (
                <Button 
                  onClick={handleAutoValidateLoA}
                  variant="outline"
                  className="bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-800"
                >
                  Auto-Validate LoA (Testing)
                </Button>
              )}
              <Button 
                onClick={handleOptimizeClick}
                disabled={site.loa_status !== 'Verified'}
                size="lg"
                className="btn-primary"
              >
                <Battery className="mr-2 h-5 w-5" />
                Run Battery Optimization
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Energy Overview Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Energy Overview</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-card border-0 group hover:shadow-primary transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Electricity Usage</CardTitle>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <Zap className="h-5 w-5 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">12,450 kWh</div>
                <p className="text-sm text-muted-foreground mt-1">Last 12 months</p>
                <div className="text-lg font-semibold text-yellow-600 mt-2">£3,735</div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 group hover:shadow-secondary transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Gas Usage</CardTitle>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">8,200 kWh</div>
                <p className="text-sm text-muted-foreground mt-1">Last 12 months</p>
                <div className="text-lg font-semibold text-blue-600 mt-2">£574</div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 group hover:shadow-primary transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">Potential Savings</CardTitle>
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <Battery className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">£1,240</div>
                <p className="text-sm text-muted-foreground mt-1">Estimated annual</p>
                <div className="text-lg font-semibold text-primary mt-2">33% reduction</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Information */}
        <section className="grid gap-8 lg:grid-cols-2">
          <Card className="shadow-card border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl">Site Information</CardTitle>
              <CardDescription>Property and energy details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Contact Person</span>
                    <div className="mt-1">
                      <div className="font-medium">{site.contacts?.first_name} {site.contacts?.last_name}</div>
                      <div className="text-sm text-muted-foreground">{site.contacts?.email}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Property Details</span>
                    <div className="mt-1">
                      <div className="font-medium">{site.floors} floors</div>
                      <div className="text-sm text-muted-foreground">{site.area_m2} m² total area</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Building Information</span>
                    <div className="mt-1">
                      <div className="font-medium">Built in {site.year_built}</div>
                      <div className="text-sm text-muted-foreground">Listed grade: {site.listed_grade}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Energy Suppliers</span>
                    <div className="mt-1">
                      <div className="font-medium">Electricity: {site.elec_supplier}</div>
                      <div className="font-medium">Gas: {site.gas_supplier}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl">Meter Configuration</CardTitle>
              <CardDescription>Electricity and gas meter information</CardDescription>
            </CardHeader>
            <CardContent>
              {meters.length > 0 ? (
                <div className="space-y-4">
                  {meters.map((meter) => (
                    <div key={meter.id} className="p-4 border border-border/50 rounded-xl bg-gradient-to-r from-muted/20 to-transparent">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            meter.meter_type === 'ELEC' 
                              ? 'bg-yellow-100 text-yellow-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {meter.meter_type === 'ELEC' ? (
                              <Zap className="h-5 w-5" />
                            ) : (
                              <TrendingUp className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{meter.meter_type} Meter</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {meter.meter_type === 'ELEC' 
                                ? meter.mpan_top_line || meter.mpan_full
                                : meter.mprn
                              }
                            </div>
                          </div>
                        </div>
                        {meter.meter_type === 'ELEC' && meter.mic && (
                          <div className="text-right">
                            <div className="text-sm font-medium text-muted-foreground">Maximum Import</div>
                            <div className="text-lg font-bold text-primary">{meter.mic}kW</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <div>No meters configured</div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Authorization Warning */}
        {site.loa_status !== 'Verified' && (
          <Card className="mt-8 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-card">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Battery className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="text-yellow-800 font-semibold text-lg mb-2">
                  Battery Optimization Unavailable
                </div>
                <p className="text-yellow-700 max-w-2xl mx-auto">
                  Letter of Authority verification is required to access advanced optimization features.
                  Current status: <span className="font-semibold">{site.loa_status}</span>
                </p>
                {site.loa_status !== 'Verified' && (
                  <Button 
                    onClick={handleAutoValidateLoA}
                    className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Auto-Validate for Testing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SiteDashboard;