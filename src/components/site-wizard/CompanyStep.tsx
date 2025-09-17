import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  companies_house_id?: string;
}

interface CompanyStepProps {
  onNext: (data: Company) => void;
  initialData?: Company | null;
}

const CompanyStep = ({ onNext, initialData }: CompanyStepProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [companiesHouseResults, setCompaniesHouseResults] = useState([]);
  const [selectedCompaniesHouseId, setSelectedCompaniesHouseId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
    if (initialData) {
      setSelectedCompany(initialData.id);
    }
  }, [initialData]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive"
      });
    }
  };

  const searchCompaniesHouse = async (query: string) => {
    if (query.length < 3) {
      setCompaniesHouseResults([]);
      return;
    }

    // Simulated Companies House search - in real implementation, this would call the actual API
    const mockResults = [
      { company_number: '12345678', title: `${query} Ltd` },
      { company_number: '87654321', title: `${query} Limited` },
      { company_number: '11111111', title: `${query} Solutions` }
    ];
    
    setCompaniesHouseResults(mockResults);
  };

  const handleNewCompanySubmit = async () => {
    if (!newCompanyName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: newCompanyName,
          companies_house_id: selectedCompaniesHouseId || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company added successfully"
      });

      await fetchCompanies();
      onNext(data);
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExistingCompanySelect = () => {
    const company = companies.find(c => c.id === selectedCompany);
    if (company) {
      onNext(company);
    }
  };

  return (
    <div className="space-y-6">
      {!isAddingNew ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="company-select">Select Company</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a company..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleExistingCompanySelect}
              disabled={!selectedCompany}
              className="flex-1"
            >
              Continue with Selected Company
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Company
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Add New Company
            </CardTitle>
            <CardDescription>
              Search Companies House registry or add manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={newCompanyName}
                onChange={(e) => {
                  setNewCompanyName(e.target.value);
                  searchCompaniesHouse(e.target.value);
                }}
                placeholder="Type company name to search..."
              />
            </div>

            {companiesHouseResults.length > 0 && (
              <div>
                <Label>Companies House Results</Label>
                <div className="space-y-2 mt-2">
                  {companiesHouseResults.map((result: any) => (
                    <Card 
                      key={result.company_number}
                      className={`cursor-pointer transition-colors ${
                        selectedCompaniesHouseId === result.company_number 
                          ? 'ring-2 ring-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        setSelectedCompaniesHouseId(result.company_number);
                        setNewCompanyName(result.title);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Company Number: {result.company_number}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleNewCompanySubmit}
                disabled={!newCompanyName.trim() || loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Company'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingNew(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanyStep;