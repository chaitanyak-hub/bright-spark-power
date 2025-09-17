import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BatteryOptimizerData {
  mpanNumber: string;
  mic: number;
  minThresh: number;
  maxThresh: number;
  cycleEff: number;
  batteryGross: number;
  startKwh: number;
  incrementKwh: number;
  endKwh: number;
  fromDateTime?: string;
  toDateTime?: string;
  startKwp?: number;
  incrementKwp?: number;
  endKwp?: number;
}

interface ApiResponse {
  [key: string]: any;
}

const BatteryOptimizerForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BatteryOptimizerData>();

  const onSubmit = async (data: BatteryOptimizerData) => {
    setIsLoading(true);
    try {
      const apiBody = {
        mpan: data.mpanNumber || "1470000721881",
        fromDateTime: data.fromDateTime || "2025-04-01T00:00",
        toDateTime: data.toDateTime || "2026-03-31T00:00",
        availableCapacity: null,
        MIC: data.mic || 500,
        cycleEff: data.cycleEff || 0.95,
        minThresh: data.minThresh || 0.1,
        maxThresh: data.maxThresh || 0.9,
        batteryGross: data.batteryGross || 500.0,
        startKwp: data.startKwp || 0.0,
        incrementKwp: data.incrementKwp || 0.0,
        endKwp: data.endKwp || 0.0,
        startKwh: data.startKwh || 500.0,
        incrementKwh: data.incrementKwh || 100.0,
        endKwh: data.endKwh || 1200.0,
        generationMetaData: {
          panelCount: null,
          panelCapacityWatts: 500,
          installationCostPerWatt: 1.0,
          dcToAcDerate: 0.85,
          installationLifeSpan: 30,
          efficiencyDepreciationFactor: 0.995
        }
      };

      const apiResponse = await supabase.functions.invoke('battery-optimizer', {
        body: apiBody
      });

      if (apiResponse.error) {
        throw new Error(apiResponse.error.message || 'Failed to call battery optimizer');
      }

      const result = apiResponse.data;
      setResponse(result);
      
      toast({
        title: "Success",
        description: "Battery optimization request submitted successfully",
      });
    } catch (error) {
      console.error('API call error:', error);
      toast({
        title: "Error",
        description: "Failed to submit battery optimization request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Battery Optimization Request</CardTitle>
          <CardDescription>
            Enter site details to get optimal battery configuration for UK sites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mpanNumber">MPAN Number</Label>
                <Input
                  id="mpanNumber"
                  {...register('mpanNumber', { required: 'MPAN Number is required' })}
                  placeholder="Enter MPAN Number"
                />
                {errors.mpanNumber && (
                  <p className="text-sm text-destructive">{errors.mpanNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mic">MIC</Label>
                <Input
                  id="mic"
                  type="number"
                  {...register('mic', { 
                    required: 'MIC is required',
                    valueAsNumber: true 
                  })}
                  placeholder="Enter MIC (default: 500)"
                />
                {errors.mic && (
                  <p className="text-sm text-destructive">{errors.mic.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minThresh">Min Threshold</Label>
                <Input
                  id="minThresh"
                  type="number"
                  step="0.01"
                  {...register('minThresh', { 
                    required: 'Min Threshold is required',
                    valueAsNumber: true 
                  })}
                  placeholder="Enter Min Threshold (default: 0.1)"
                />
                {errors.minThresh && (
                  <p className="text-sm text-destructive">{errors.minThresh.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxThresh">Max Threshold</Label>
                <Input
                  id="maxThresh"
                  type="number"
                  step="0.01"
                  {...register('maxThresh', { 
                    required: 'Max Threshold is required',
                    valueAsNumber: true 
                  })}
                  placeholder="Enter Max Threshold (default: 0.9)"
                />
                {errors.maxThresh && (
                  <p className="text-sm text-destructive">{errors.maxThresh.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycleEff">Cycle Efficiency</Label>
                <Input
                  id="cycleEff"
                  type="number"
                  step="0.01"
                  {...register('cycleEff', { 
                    required: 'Cycle Efficiency is required',
                    valueAsNumber: true 
                  })}
                  placeholder="Enter Cycle Efficiency (default: 0.95)"
                />
                {errors.cycleEff && (
                  <p className="text-sm text-destructive">{errors.cycleEff.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="batteryGross">Battery Gross (kWh)</Label>
                <Input
                  id="batteryGross"
                  type="number"
                  step="0.01"
                  {...register('batteryGross', { 
                    required: 'Battery Gross is required',
                    valueAsNumber: true 
                  })}
                  placeholder="Enter Battery Gross (default: 500.0)"
                />
                {errors.batteryGross && (
                  <p className="text-sm text-destructive">{errors.batteryGross.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startKwh">Start kWh</Label>
                <Input
                  id="startKwh"
                  type="number"
                  step="0.01"
                  {...register('startKwh', { 
                    required: 'Start kWh is required',
                    valueAsNumber: true 
                  })}
                  placeholder="Enter Start kWh (default: 500.0)"
                />
                {errors.startKwh && (
                  <p className="text-sm text-destructive">{errors.startKwh.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="incrementKwh">Increment kWh</Label>
                <Input
                  id="incrementKwh"
                  type="number"
                  step="0.01"
                  {...register('incrementKwh', { 
                    required: 'Increment kWh is required',
                    valueAsNumber: true 
                  })}
                  placeholder="Enter Increment kWh (default: 100.0)"
                />
                {errors.incrementKwh && (
                  <p className="text-sm text-destructive">{errors.incrementKwh.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endKwh">End kWh</Label>
                <Input
                  id="endKwh"
                  type="number"
                  step="0.01"
                  {...register('endKwh', { 
                    required: 'End kWh is required',
                    valueAsNumber: true 
                  })}
                  placeholder="Enter End kWh (default: 1200.0)"
                />
                {errors.endKwh && (
                  <p className="text-sm text-destructive">{errors.endKwh.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Submitting...' : 'Submit Battery Optimization Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle>API Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatteryOptimizerForm;