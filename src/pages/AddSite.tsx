import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import CompanyStep from '@/components/site-wizard/CompanyStep';
import ContactStep from '@/components/site-wizard/ContactStep';
import AddressStep from '@/components/site-wizard/AddressStep';
import MeterStep from '@/components/site-wizard/MeterStep';
import SiteDetailsStep from '@/components/site-wizard/SiteDetailsStep';
import LoAStep from '@/components/site-wizard/LoAStep';

const STEPS = [
  { id: 'company', title: 'Company', description: 'Select or add company' },
  { id: 'contact', title: 'Contact', description: 'Add contact person' },
  { id: 'address', title: 'Address', description: 'Site location' },
  { id: 'meters', title: 'Meters', description: 'Confirm meter details' },
  { id: 'details', title: 'Site Details', description: 'Energy consumption data' },
  { id: 'loa', title: 'Authorization', description: 'Letter of Authority' },
];

const AddSite = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [siteData, setSiteData] = useState({
    company: null,
    contact: null,
    address: null,
    meters: [],
    details: null,
    loa: null
  });

  const currentStepId = STEPS[currentStep].id;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = (stepData: any) => {
    setSiteData(prev => ({ ...prev, [currentStepId]: stepData }));
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = (stepData: any) => {
    setSiteData(prev => ({ ...prev, [currentStepId]: stepData }));
    // Navigate to the created site's dashboard
    navigate('/'); // For now, go back to main page
  };

  const renderStep = () => {
    switch (currentStepId) {
      case 'company':
        return <CompanyStep onNext={handleNext} initialData={siteData.company} />;
      case 'contact':
        return <ContactStep onNext={handleNext} onBack={handleBack} company={siteData.company} initialData={siteData.contact} />;
      case 'address':
        return <AddressStep onNext={handleNext} onBack={handleBack} initialData={siteData.address} />;
      case 'meters':
        return <MeterStep onNext={handleNext} onBack={handleBack} address={siteData.address} initialData={siteData.meters} />;
      case 'details':
        return <SiteDetailsStep onNext={handleNext} onBack={handleBack} address={siteData.address} initialData={siteData.details} />;
      case 'loa':
        return <LoAStep onComplete={handleComplete} onBack={handleBack} siteData={siteData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Add New Site</h1>
          <p className="text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].description}
          </p>
          
          <div className="mt-4">
            <Progress value={progress} className="w-full h-2" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              {STEPS.map((step, index) => (
                <span key={step.id} className={index <= currentStep ? 'text-primary font-medium' : ''}>
                  {step.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddSite;