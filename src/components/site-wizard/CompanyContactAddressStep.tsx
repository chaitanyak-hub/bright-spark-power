import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Building2, User, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  companies_house_id?: string;
}

interface Contact {
  id: string;
  title?: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Address {
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postcode: string;
  uprn?: string;
}

interface CombinedData {
  company: Company;
  contact: Contact;
  address: Address;
}

interface CompanyContactAddressStepProps {
  onNext: (data: CombinedData) => void;
  initialData?: { company?: Company | null; contact?: Contact | null; address?: Address | null };
}

const CompanyContactAddressStep = ({ onNext, initialData }: CompanyContactAddressStepProps) => {
  // Company state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [isAddingNewCompany, setIsAddingNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [companiesHouseResults, setCompaniesHouseResults] = useState([]);
  const [selectedCompaniesHouseId, setSelectedCompaniesHouseId] = useState('');

  // Contact state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [isAddingNewContact, setIsAddingNewContact] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    title: '',
    first_name: '',
    last_name: '',
    email: ''
  });

  // Address state
  const [searchQuery, setSearchQuery] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [manualAddressEntry, setManualAddressEntry] = useState(false);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
    if (initialData?.company) {
      setSelectedCompany(initialData.company.id);
    }
    if (initialData?.contact) {
      setSelectedContact(initialData.contact.id);
    }
    if (initialData?.address) {
      setSelectedAddress(initialData.address);
    }
  }, [initialData]);

  useEffect(() => {
    if (selectedCompany) {
      fetchContacts();
    } else {
      setContacts([]);
      // Reset contact states when company changes
      setSelectedContact('');
      // If we're adding a new company, automatically enable "add new contact" mode
      setIsAddingNewContact(isAddingNewCompany);
    }
  }, [selectedCompany, isAddingNewCompany]);

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

  const fetchContacts = async () => {
    if (!selectedCompany) return;
    
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('company_id', selectedCompany)
        .order('first_name');
      
      if (error) throw error;
      setContacts(data || []);
      
      // If no existing contacts, automatically enable "add new contact" mode
      if (!data || data.length === 0) {
        setIsAddingNewContact(true);
      } else {
        setIsAddingNewContact(false);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive"
      });
    }
  };

  const searchCompaniesHouse = async (query: string) => {
    if (query.length < 3) {
      setCompaniesHouseResults([]);
      return;
    }

    // Simulated Companies House search
    const mockResults = [
      { company_number: '12345678', title: `${query} Ltd` },
      { company_number: '87654321', title: `${query} Limited` },
      { company_number: '11111111', title: `${query} Solutions` }
    ];
    
    setCompaniesHouseResults(mockResults);
  };

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressResults([]);
      return;
    }

    // Simulated address lookup
    const mockResults = [
      {
        address_line_1: `1 ${query} Street`,
        address_line_2: '',
        city: 'London',
        postcode: 'SW1A 1AA',
        uprn: '123456789'
      },
      {
        address_line_1: `2 ${query} Road`,
        address_line_2: '',
        city: 'Manchester',
        postcode: 'M1 1AA',
        uprn: '987654321'
      }
    ];
    
    setAddressResults(mockResults);
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
  };

  const handleManualAddressChange = (field: keyof Address, value: string) => {
    setSelectedAddress(prev => ({
      ...prev!,
      [field]: value
    }));
  };

  const validateAndSubmit = async () => {
    // Check if user is authenticated first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create sites and companies",
        variant: "destructive"
      });
      return;
    }

    // Validation
    const companyToUse = companies.find(c => c.id === selectedCompany);
    const contactToUse = contacts.find(c => c.id === selectedContact);

    console.log('Validation Debug:', {
      user: user?.email,
      companyToUse,
      contactToUse,
      isAddingNewCompany,
      isAddingNewContact,
      contactFormData,
      selectedAddress
    });

    if (!companyToUse && !isAddingNewCompany) {
      toast({
        title: "Error",
        description: "Please select or add a company",
        variant: "destructive"
      });
      return;
    }

    if (!contactToUse && !isAddingNewContact) {
      toast({
        title: "Error",
        description: "Please select or add a contact",
        variant: "destructive"
      });
      return;
    }

    if (!selectedAddress || !selectedAddress.address_line_1 || !selectedAddress.postcode) {
      toast({
        title: "Error",
        description: "Please select or enter a complete address",
        variant: "destructive"
      });
      return;
    }

    if (isAddingNewContact && (!contactFormData.first_name || !contactFormData.last_name || !contactFormData.email)) {
      toast({
        title: "Error",
        description: "Please fill in all required contact fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let finalCompany = companyToUse;
      let finalContact = contactToUse;

      // Create new company if needed
      if (isAddingNewCompany && newCompanyName.trim()) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: newCompanyName,
            companies_house_id: selectedCompaniesHouseId || null
          })
          .select()
          .single();

        if (companyError) throw companyError;
        finalCompany = companyData;
      }

      // Create new contact if needed
      if (isAddingNewContact && finalCompany) {
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .insert({
            company_id: finalCompany.id,
            ...contactFormData
          })
          .select()
          .single();

        if (contactError) throw contactError;
        finalContact = contactData;
      }

      if (finalCompany && finalContact && selectedAddress) {
        toast({
          title: "Success",
          description: "Company, contact, and address saved successfully"
        });

        onNext({
          company: finalCompany,
          contact: finalContact,
          address: selectedAddress
        });
      }
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: "Failed to save data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Company Section */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center text-xl">
            <Building2 className="mr-3 h-6 w-6 text-primary" />
            Company Information
          </CardTitle>
          <CardDescription>Select an existing company or add a new one</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {!isAddingNewCompany ? (
            <>
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
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingNewCompany(true);
                  setIsAddingNewContact(true); // Automatically enable add new contact mode
                }}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Company
              </Button>
            </>
          ) : (
            <div className="space-y-4">
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

              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingNewCompany(false);
                  setIsAddingNewContact(false); // Reset contact mode when switching back
                }}
                className="w-full"
              >
                Use Existing Company Instead
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Contact Section */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-primary/5" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center text-xl">
            <User className="mr-3 h-6 w-6 text-primary" />
            Contact Person
          </CardTitle>
          <CardDescription>
            {selectedCompany || isAddingNewCompany 
              ? "Select an existing contact or add a new one"
              : "Please select a company first"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {(!selectedCompany && !isAddingNewCompany) ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select or add a company first
            </div>
          ) : (
            <>
              {!isAddingNewContact && contacts.length > 0 ? (
                <>
                  <div>
                    <Label htmlFor="contact-select">Select Contact</Label>
                    <Select value={selectedContact} onValueChange={setSelectedContact}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a contact..." />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.first_name} {contact.last_name} ({contact.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddingNewContact(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Contact
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Select 
                        value={contactFormData.title} 
                        onValueChange={(value) => setContactFormData(prev => ({ ...prev, title: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Ms">Ms</SelectItem>
                          <SelectItem value="Mrs">Mrs</SelectItem>
                          <SelectItem value="Dr">Dr</SelectItem>
                          <SelectItem value="Prof">Prof</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        value={contactFormData.first_name}
                        onChange={(e) => setContactFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="First name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={contactFormData.last_name}
                      onChange={(e) => setContactFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Last name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactFormData.email}
                      onChange={(e) => setContactFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                    />
                  </div>

                  {contacts.length > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingNewContact(false)}
                      className="w-full"
                    >
                      Use Existing Contact Instead
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Address Section */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center text-xl">
            <MapPin className="mr-3 h-6 w-6 text-primary" />
            Site Address
          </CardTitle>
          <CardDescription>Search for the site address or enter manually</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {!manualAddressEntry ? (
            <>
              <div>
                <Label htmlFor="address-search">Search Address</Label>
                <Input
                  id="address-search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchAddresses(e.target.value);
                  }}
                  placeholder="Enter postcode or address..."
                />
              </div>

              {addressResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Address Results</Label>
                  {addressResults.map((address: Address, index) => (
                    <Card 
                      key={index}
                      className={`cursor-pointer transition-colors ${
                        selectedAddress?.uprn === address.uprn 
                          ? 'ring-2 ring-primary' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium">
                          {address.address_line_1}
                          {address.address_line_2 && `, ${address.address_line_2}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {address.city}, {address.postcode}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => setManualAddressEntry(true)}
                className="w-full"
              >
                Enter Address Manually
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="address_line_1">Address Line 1 *</Label>
                <Input
                  id="address_line_1"
                  value={selectedAddress?.address_line_1 || ''}
                  onChange={(e) => handleManualAddressChange('address_line_1', e.target.value)}
                  placeholder="House number and street name"
                />
              </div>

              <div>
                <Label htmlFor="address_line_2">Address Line 2</Label>
                <Input
                  id="address_line_2"
                  value={selectedAddress?.address_line_2 || ''}
                  onChange={(e) => handleManualAddressChange('address_line_2', e.target.value)}
                  placeholder="Apartment, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={selectedAddress?.city || ''}
                    onChange={(e) => handleManualAddressChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode *</Label>
                  <Input
                    id="postcode"
                    value={selectedAddress?.postcode || ''}
                    onChange={(e) => handleManualAddressChange('postcode', e.target.value)}
                    placeholder="Postcode"
                  />
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => setManualAddressEntry(false)}
                className="w-full"
              >
                Search Address Instead
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <Button 
          onClick={validateAndSubmit}
          disabled={loading}
          size="lg"
          className="w-full md:w-auto px-12"
        >
          {loading ? 'Saving...' : 'Continue to Meters'}
        </Button>
      </div>
    </div>
  );
};

export default CompanyContactAddressStep;