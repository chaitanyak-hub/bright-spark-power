import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Send, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface LoAStepProps {
  onComplete: (data: any) => void;
  onBack: () => void;
  siteData: any;
}

const LoAStep = ({ onComplete, onBack, siteData }: LoAStepProps) => {
  const [loaStatus, setLoaStatus] = useState<string>('NotStarted');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please upload a PDF file only",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: "Error",
        description: "File size must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setLoaStatus('Uploaded');
    
    try {
      // Auto-validate for now - skip verification process
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoaStatus('Verified');
      
      toast({
        title: "Success",
        description: "Letter of Authority automatically verified for testing",
      });
      await createSite();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
      setLoaStatus('Failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSendDigitalLoA = async () => {
    setLoaStatus('Sent');
    
    try {
      // Auto-validate for now - skip signature process
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoaStatus('Verified');
      
      toast({
        title: "Success",
        description: "Digital Letter of Authority automatically verified for testing",
      });
      
      await createSite();
    } catch (error) {
      console.error('Send error:', error);
      toast({
        title: "Error",
        description: "Failed to send digital LoA",
        variant: "destructive"
      });
    }
  };

  const createSite = async () => {
    setCreating(true);
    
    try {
      // Create the site record
      const { data: site, error: siteError } = await supabase
        .from('sites')
        .insert({
          company_id: siteData.company.id,
          contact_id: siteData.contact.id,
          ...siteData.address,
          ...siteData.details,
          loa_status: loaStatus
        })
        .select()
        .single();

      if (siteError) throw siteError;

      // Create meter records
      for (const meter of siteData.meters) {
        const { error: meterError } = await supabase
          .from('meters')
          .insert({
            site_id: site.id,
            ...meter
          });
        
        if (meterError) throw meterError;
      }

      toast({
        title: "Success",
        description: "Site created successfully!"
      });

      // Navigate to the new site
      navigate(`/site/${site.id}`);
    } catch (error) {
      console.error('Error creating site:', error);
      toast({
        title: "Error",
        description: "Failed to create site",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const getStatusIcon = () => {
    switch (loaStatus) {
      case 'Verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Verifying':
      case 'Sent':
      case 'PendingSignature':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (loaStatus) {
      case 'Verified':
        return 'bg-green-100 text-green-700';
      case 'Failed':
        return 'bg-red-100 text-red-700';
      case 'Verifying':
      case 'Sent':
      case 'PendingSignature':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <div>Company: <span className="font-medium">{siteData.company?.name}</span></div>
        <div>Contact: <span className="font-medium">{siteData.contact?.first_name} {siteData.contact?.last_name}</span></div>
        <div>Address: <span className="font-medium">{siteData.address?.address_line_1}, {siteData.address?.postcode}</span></div>
      </div>

      {loaStatus !== 'NotStarted' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="font-medium">Letter of Authority Status</span>
              </div>
              <Badge className={getStatusColor()}>
                {loaStatus === 'PendingSignature' ? 'Pending Signature' : loaStatus}
              </Badge>
            </div>
            {loaStatus === 'PendingSignature' && (
              <p className="text-sm text-muted-foreground mt-2">
                Sent to {siteData.contact?.email} - awaiting signature
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {loaStatus === 'NotStarted' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Upload LoA Document
              </CardTitle>
              <CardDescription>
                Upload a signed PDF Letter of Authority
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                <ul className="list-disc list-inside space-y-1">
                  <li>PDF format only</li>
                  <li>Maximum 10MB file size</li>
                  <li>Must be signed by authorized person</li>
                </ul>
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Button className="w-full" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Choose PDF File'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="mr-2 h-5 w-5" />
                Send Digital LoA
              </CardTitle>
              <CardDescription>
                Send a digital Letter of Authority for e-signature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                <ul className="list-disc list-inside space-y-1">
                  <li>Sent to: {siteData.contact?.email}</li>
                  <li>Digital signature required</li>
                  <li>Instant verification</li>
                </ul>
              </div>
              <Button 
                onClick={handleSendDigitalLoA}
                className="w-full"
                variant="outline"
              >
                Send Digital LoA
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {(loaStatus === 'Verified' || loaStatus === 'PendingSignature') && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                {loaStatus === 'Verified' ? 'Site Ready!' : 'Site Created!'}
              </h3>
              <p className="text-green-700 mb-4">
                {loaStatus === 'Verified' 
                  ? 'Letter of Authority verified. You can now access all solar recommendations and run battery optimizations.'
                  : 'Site created successfully. Solar recommendations will be available once the LoA is signed.'
                }
              </p>
              <Button 
                onClick={createSite}
                disabled={creating}
                className="bg-green-600 hover:bg-green-700"
              >
                {creating ? 'Creating Site...' : 'Go to Site Dashboard'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loaStatus === 'Failed' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">Verification Failed</h3>
              <p className="text-red-700 mb-4">
                The uploaded document could not be verified. Please check the document and try again, or use the digital LoA option.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => setLoaStatus('NotStarted')}
                  variant="outline"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={createSite}
                  disabled={creating}
                  variant="secondary"
                >
                  {creating ? 'Creating...' : 'Create Site Without LoA'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
      </div>
    </div>
  );
};

export default LoAStep;