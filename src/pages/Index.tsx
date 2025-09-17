import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, Activity, Zap, TrendingUp, Battery, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select(`
          *,
          companies(name),
          contacts(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
        <div className="container mx-auto px-6 py-20 relative">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6 border border-white/20">
              <Zap className="mr-2 h-4 w-4 text-orange-300" />
              Powered by Advanced Energy Analytics
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Cut Your Energy Costs by Up to{' '}
              <span className="text-orange-300">30%</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
              Revolutionary Solar & Battery Solutions with Continuously Improving Algorithm with Real Data
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="btn-primary text-lg px-8 py-4 h-auto">
                <Link to="/add-site">
                  <Plus className="mr-2 h-5 w-5" />
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-white/70 mt-4">
              Free consultation • No obligation • Expert analysis
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Our Platform?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real savings, measurable impact, sustainable future
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <Card className="feature-card group hover:scale-105 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Save on Costs</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Reduce annual energy spend by up to 30% with smart optimization
                </p>
              </CardContent>
            </Card>

            <Card className="feature-card group hover:scale-105 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/20 transition-colors">
                  <Zap className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-xl">Fast ROI</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Payback in as little as 12–24 months with battery + solar
                </p>
              </CardContent>
            </Card>

            <Card className="feature-card group hover:scale-105 transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Battery className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Maximise Revenue</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Generate income through grid trading and energy arbitrage
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Stats */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Dashboard Overview</h2>
                <p className="text-muted-foreground text-lg">
                  Manage your sites and track optimization progress
                </p>
              </div>
              <Button asChild size="lg" className="btn-primary">
                <Link to="/add-site">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Site
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-12">
              <Card className="shadow-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Sites</CardTitle>
                  <Building2 className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{sites.length}</div>
                  <p className="text-sm text-muted-foreground mt-1">Active locations</p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Optimizations</CardTitle>
                  <Activity className="h-5 w-5 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary">0</div>
                  <p className="text-sm text-muted-foreground mt-1">Currently running</p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Potential Savings</CardTitle>
                  <Zap className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">£0</div>
                  <p className="text-sm text-muted-foreground mt-1">Estimated annual</p>
                </CardContent>
              </Card>
            </div>

            {/* Sites Grid */}
            {loading ? (
              <Card className="shadow-card">
                <CardContent className="p-12">
                  <div className="text-center text-muted-foreground">
                    <div className="animate-pulse">Loading sites...</div>
                  </div>
                </CardContent>
              </Card>
            ) : sites.length === 0 ? (
              <Card className="shadow-card border-dashed border-2">
                <CardContent className="p-12">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">No sites yet</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Get started by adding your first site to begin optimizing battery performance and energy savings.
                    </p>
                    <Button asChild size="lg" className="btn-primary">
                      <Link to="/add-site">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Site
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sites.map((site: any) => (
                  <Card key={site.id} className="shadow-card hover:shadow-primary group transition-all duration-300 border-0">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">
                        {site.companies?.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {site.address_line_1}, {site.postcode}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Contact:</span>
                          <span className="font-medium">{site.contacts?.first_name} {site.contacts?.last_name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">LoA Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            site.loa_status === 'Verified' 
                              ? 'bg-green-100 text-green-700' 
                              : site.loa_status === 'Failed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {site.loa_status}
                          </span>
                        </div>
                      </div>
                      <Button asChild variant="outline" className="w-full mt-6 group-hover:border-primary group-hover:text-primary">
                        <Link to={`/site/${site.id}`}>
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;