import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Zap, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Meter {
  id?: string;
  meter_type: 'ELEC' | 'GAS';
  mpan_top_line?: string;
  mpan_full?: string;
  mprn?: string;
  mic?: number;
  status: string;
}

interface MeterStepProps {
  onNext: (data: Meter[]) => void;
  onBack: () => void;
  address: any;
  initialData?: Meter[];
}

const MeterStep = ({ onNext, onBack, address, initialData }: MeterStepProps) => {
  const [meters, setMeters] = useState<Meter[]>(initialData || []);
  const [newMeter, setNewMeter] = useState<Partial<Meter>>({
    meter_type: 'ELEC',
    status: 'Active'
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (address && meters.length === 0) {
      fetchMetersForAddress();
    }
  }, [address]);

  const fetchMetersForAddress = async () => {
    setLoading(true);
    try {
      // Simulated meter fetch - in real implementation, this would call an external API
      const mockMeters: Meter[] = [
        {
          meter_type: 'ELEC',
          mpan_top_line: '1470000721881',
          mpan_full: '01 470 000 721 881',
          mic: 500,
          status: 'Active'
        },
        {
          meter_type: 'GAS',
          mprn: '1234567890',
          status: 'Active'
        }
      ];
      
      setMeters(mockMeters);
      toast({
        title: "Success",
        description: `Found ${mockMeters.length} meters for this address`
      });
    } catch (error) {
      console.error('Error fetching meters:', error);
      toast({
        title: "Info",
        description: "Could not auto-fetch meters. Please add them manually.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeter = () => {
    if (!newMeter.meter_type) {
      toast({
        title: "Error",
        description: "Please select a meter type",
        variant: "destructive"
      });
      return;
    }

    if (newMeter.meter_type === 'ELEC' && !newMeter.mpan_top_line) {
      toast({
        title: "Error",
        description: "MPAN is required for electricity meters",
        variant: "destructive"
      });
      return;
    }

    if (newMeter.meter_type === 'GAS' && !newMeter.mprn) {
      toast({
        title: "Error",
        description: "MPRN is required for gas meters",
        variant: "destructive"
      });
      return;
    }

    setMeters(prev => [...prev, { ...newMeter, id: Date.now().toString() } as Meter]);
    setNewMeter({ meter_type: 'ELEC', status: 'Active' });
    setShowAddForm(false);
    
    toast({
      title: "Success",
      description: "Meter added successfully"
    });
  };

  const handleRemoveMeter = (index: number) => {
    setMeters(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    const electricMeters = meters.filter(m => m.meter_type === 'ELEC');
    if (electricMeters.length === 0) {
      toast({
        title: "Error",
        description: "At least one electricity meter is required to proceed",
        variant: "destructive"
      });
      return;
    }
    onNext(meters);
  };

  const validateMPAN = (mpan: string) => {
    // Basic MPAN validation - should be 13 digits for top line
    return /^\d{13}$/.test(mpan.replace(/\s/g, ''));
  };

  const validateMPRN = (mprn: string) => {
    // Basic MPRN validation - should be 6-10 digits
    return /^\d{6,10}$/.test(mprn);
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Address: {address?.address_line_1}, {address?.postcode}
      </div>

      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Fetching meters for this address...
            </div>
          </CardContent>
        </Card>
      )}

      {meters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirmed Meters</CardTitle>
            <CardDescription>
              Meters found for this address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>MIC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meters.map((meter, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center">
                        {meter.meter_type === 'ELEC' ? (
                          <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                        ) : (
                          <Flame className="mr-2 h-4 w-4 text-blue-500" />
                        )}
                        {meter.meter_type}
                      </div>
                    </TableCell>
                    <TableCell>
                      {meter.meter_type === 'ELEC' 
                        ? meter.mpan_top_line || meter.mpan_full
                        : meter.mprn
                      }
                    </TableCell>
                    <TableCell>
                      {meter.meter_type === 'ELEC' ? (meter.mic || '-') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meter.status === 'Active' ? 'default' : 'secondary'}>
                        {meter.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMeter(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!showAddForm ? (
        <div className="flex gap-2">
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
          <Button onClick={() => setShowAddForm(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Meter
          </Button>
          <Button 
            onClick={handleNext}
            disabled={meters.filter(m => m.meter_type === 'ELEC').length === 0}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Add New Meter</CardTitle>
            <CardDescription>
              Enter meter details manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Meter Type</Label>
              <Select 
                value={newMeter.meter_type} 
                onValueChange={(value: 'ELEC' | 'GAS') => setNewMeter(prev => ({ ...prev, meter_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ELEC">Electricity</SelectItem>
                  <SelectItem value="GAS">Gas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newMeter.meter_type === 'ELEC' ? (
              <>
                <div>
                  <Label htmlFor="mpan">MPAN (13 digits) *</Label>
                  <Input
                    id="mpan"
                    value={newMeter.mpan_top_line || ''}
                    onChange={(e) => setNewMeter(prev => ({ ...prev, mpan_top_line: e.target.value }))}
                    placeholder="1234567890123"
                  />
                  {newMeter.mpan_top_line && !validateMPAN(newMeter.mpan_top_line) && (
                    <div className="text-sm text-red-500 mt-1">
                      MPAN should be 13 digits
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="mic">Maximum Import Capacity (MIC)</Label>
                  <Input
                    id="mic"
                    type="number"
                    value={newMeter.mic || ''}
                    onChange={(e) => setNewMeter(prev => ({ ...prev, mic: parseInt(e.target.value) || undefined }))}
                    placeholder="e.g. 500"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="mprn">MPRN (6-10 digits) *</Label>
                <Input
                  id="mprn"
                  value={newMeter.mprn || ''}
                  onChange={(e) => setNewMeter(prev => ({ ...prev, mprn: e.target.value }))}
                  placeholder="1234567890"
                />
                {newMeter.mprn && !validateMPRN(newMeter.mprn) && (
                  <div className="text-sm text-red-500 mt-1">
                    MPRN should be 6-10 digits
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => setShowAddForm(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleAddMeter} className="flex-1">
                Add Meter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MeterStep;