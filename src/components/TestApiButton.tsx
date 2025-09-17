import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TestApiButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const runTest = async () => {
    setIsLoading(true);
    try {
      console.log('Calling test-battery-api function...');
      
      const response = await supabase.functions.invoke('test-battery-api');
      
      console.log('Test function response:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Test function failed');
      }

      setTestResult(response.data);
      
      toast({
        title: response.data.success ? "Test Successful" : "Test Failed",
        description: response.data.success 
          ? `API responded with status ${response.data.status}`
          : `API failed with status ${response.data.status}: ${response.data.statusText}`,
        variant: response.data.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ error: error.message });
      toast({
        title: "Test Error",
        description: `Test failed: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Test</CardTitle>
          <CardDescription>
            Test the battery optimiser API with the exact payload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runTest} disabled={isLoading} className="w-full">
            {isLoading ? 'Testing API...' : 'Test Battery Optimiser API'}
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm max-h-96">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestApiButton;