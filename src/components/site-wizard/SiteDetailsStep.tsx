import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface SiteDetails {
  elec_unit_rate_pence: number;
  elec_supplier: string;
  gas_unit_rate_pence?: number;
  gas_supplier?: string;
  area_m2?: number;
  floors?: number;
  year_built?: number;
  listed_grade?: string;
  heating_pct: number;
  hot_water_pct: number;
  lighting_pct: number;
  cooking_pct: number;
  others_pct: number;
}

interface SiteDetailsStepProps {
  onNext: (data: SiteDetails) => void;
  onBack: () => void;
  address: any;
  initialData?: SiteDetails | null;
}

const SiteDetailsStep = ({ onNext, onBack, address, initialData }: SiteDetailsStepProps) => {
  const [formData, setFormData] = useState<SiteDetails>(initialData || {
    elec_unit_rate_pence: 30,
    elec_supplier: 'British Gas',
    gas_unit_rate_pence: 7,
    gas_supplier: 'British Gas',
    area_m2: 100,
    floors: 2,
    year_built: 1950,
    listed_grade: 'None',
    heating_pct: 40,
    hot_water_pct: 20,
    lighting_pct: 15,
    cooking_pct: 10,
    others_pct: 15
  });

  const { toast } = useToast();

  const updateField = (field: keyof SiteDetails, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateEnergyField = (field: keyof SiteDetails, value: number) => {
    const otherFields = ['heating_pct', 'hot_water_pct', 'lighting_pct', 'cooking_pct', 'others_pct'].filter(f => f !== field);
    const otherTotal = otherFields.reduce((sum, f) => sum + (formData[f as keyof SiteDetails] as number || 0), 0);
    
    if (otherTotal + value > 100) {
      // Adjust "others" automatically if possible
      if (field !== 'others_pct') {
        const newOthers = Math.max(0, 100 - otherTotal - value + (formData.others_pct || 0));
        setFormData(prev => ({ ...prev, [field]: value, others_pct: newOthers }));
      } else {
        setFormData(prev => ({ ...prev, [field]: Math.max(0, 100 - otherTotal) }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const getTotalPercentage = () => {
    return (formData.heating_pct || 0) + 
           (formData.hot_water_pct || 0) + 
           (formData.lighting_pct || 0) + 
           (formData.cooking_pct || 0) + 
           (formData.others_pct || 0);
  };

  const handleNext = () => {
    const total = getTotalPercentage();
    if (total !== 100) {
      toast({
        title: "Error",
        description: "Energy consumption percentages must total exactly 100%",
        variant: "destructive"
      });
      return;
    }

    if (!formData.elec_unit_rate_pence || !formData.elec_supplier) {
      toast({
        title: "Error",
        description: "Electricity rate and supplier are required",
        variant: "destructive"
      });
      return;
    }

    onNext(formData);
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Address: {address?.address_line_1}, {address?.postcode}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Energy Suppliers & Rates</CardTitle>
            <CardDescription>Current energy supply details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="elec_supplier">Electricity Supplier *</Label>
              <Input
                id="elec_supplier"
                value={formData.elec_supplier}
                onChange={(e) => updateField('elec_supplier', e.target.value)}
                placeholder="e.g. British Gas"
              />
            </div>
            <div>
              <Label htmlFor="elec_unit_rate">Electricity Unit Rate (p/kWh) *</Label>
              <Input
                id="elec_unit_rate"
                type="number"
                step="0.01"
                value={formData.elec_unit_rate_pence}
                onChange={(e) => updateField('elec_unit_rate_pence', parseFloat(e.target.value) || 0)}
                placeholder="30.00"
              />
            </div>
            <div>
              <Label htmlFor="gas_supplier">Gas Supplier</Label>
              <Input
                id="gas_supplier"
                value={formData.gas_supplier || ''}
                onChange={(e) => updateField('gas_supplier', e.target.value)}
                placeholder="e.g. British Gas"
              />
            </div>
            <div>
              <Label htmlFor="gas_unit_rate">Gas Unit Rate (p/kWh)</Label>
              <Input
                id="gas_unit_rate"
                type="number"
                step="0.01"
                value={formData.gas_unit_rate_pence || ''}
                onChange={(e) => updateField('gas_unit_rate_pence', parseFloat(e.target.value) || undefined)}
                placeholder="7.00"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>Physical characteristics of the site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="area_m2">Site Area (m²)</Label>
              <Input
                id="area_m2"
                type="number"
                value={formData.area_m2 || ''}
                onChange={(e) => updateField('area_m2', parseInt(e.target.value) || undefined)}
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="floors">Number of Floors</Label>
              <Input
                id="floors"
                type="number"
                value={formData.floors || ''}
                onChange={(e) => updateField('floors', parseInt(e.target.value) || undefined)}
                placeholder="2"
              />
            </div>
            <div>
              <Label htmlFor="year_built">Year Built</Label>
              <Input
                id="year_built"
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={formData.year_built || ''}
                onChange={(e) => updateField('year_built', parseInt(e.target.value) || undefined)}
                placeholder="1950"
              />
            </div>
            <div>
              <Label htmlFor="listed_grade">Listed Grade</Label>
              <Select 
                value={formData.listed_grade || ''} 
                onValueChange={(value) => updateField('listed_grade', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="I">Grade I</SelectItem>
                  <SelectItem value="II*">Grade II*</SelectItem>
                  <SelectItem value="II">Grade II</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Energy Consumption Split</CardTitle>
          <CardDescription>
            Percentage breakdown of energy usage (must total 100%)
            <div className={`mt-2 font-medium ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Current total: {getTotalPercentage()}%
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label htmlFor="heating_pct">Heating (%)</Label>
              <Input
                id="heating_pct"
                type="number"
                min="0"
                max="100"
                value={formData.heating_pct || ''}
                onChange={(e) => updateEnergyField('heating_pct', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="hot_water_pct">Hot Water (%)</Label>
              <Input
                id="hot_water_pct"
                type="number"
                min="0"
                max="100"
                value={formData.hot_water_pct || ''}
                onChange={(e) => updateEnergyField('hot_water_pct', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="lighting_pct">Lighting (%)</Label>
              <Input
                id="lighting_pct"
                type="number"
                min="0"
                max="100"
                value={formData.lighting_pct || ''}
                onChange={(e) => updateEnergyField('lighting_pct', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="cooking_pct">Cooking (%)</Label>
              <Input
                id="cooking_pct"
                type="number"
                min="0"
                max="100"
                value={formData.cooking_pct || ''}
                onChange={(e) => updateEnergyField('cooking_pct', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="others_pct">Others (%)</Label>
              <Input
                id="others_pct"
                type="number"
                min="0"
                max="100"
                value={formData.others_pct || ''}
                onChange={(e) => updateEnergyField('others_pct', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
};

export default SiteDetailsStep;