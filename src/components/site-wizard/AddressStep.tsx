import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Address {
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postcode: string;
  uprn?: string;
}

interface AddressStepProps {
  onNext: (data: Address) => void;
  onBack: () => void;
  initialData?: Address | null;
}

const AddressStep = ({ onNext, onBack, initialData }: AddressStepProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [addressResults, setAddressResults] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(initialData || null);
  const [manualEntry, setManualEntry] = useState(false);
  const { toast } = useToast();

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressResults([]);
      return;
    }

    // Simulated address lookup - in real implementation, this would call a postcode/address API
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
      },
      {
        address_line_1: `10 ${query} Avenue`,
        address_line_2: 'Suite 1',
        city: 'Birmingham',
        postcode: 'B1 1AA',
        uprn: '456789123'
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

  const handleNext = () => {
    if (!selectedAddress || !selectedAddress.address_line_1 || !selectedAddress.postcode) {
      toast({
        title: "Error",
        description: "Please select or enter a complete address",
        variant: "destructive"
      });
      return;
    }
    onNext(selectedAddress);
  };

  return (
    <div className="space-y-6">
      {!manualEntry ? (
        <div className="space-y-4">
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

          <div className="flex gap-2">
            <Button onClick={onBack} variant="outline">
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!selectedAddress}
              className="flex-1"
            >
              Continue with Selected Address
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setManualEntry(true)}
            >
              Enter Manually
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Enter Address Manually
            </CardTitle>
            <CardDescription>
              Enter the site address details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="flex gap-2">
              <Button onClick={onBack} variant="outline">
                Back
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!selectedAddress?.address_line_1 || !selectedAddress?.postcode}
                className="flex-1"
              >
                Continue
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setManualEntry(false)}
              >
                Search Instead
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddressStep;