import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import MockAuthStatus from '@/components/MockAuthStatus';

import CompanyContactAddressStep from '@/components/site-wizard/CompanyContactAddressStep';
import MeterStep from '@/components/site-wizard/MeterStep';
import SiteDetailsStep from '@/components/site-wizard/SiteDetailsStep';
import LoAStep from '@/components/site-wizard/LoAStep';

const STEPS = [
  { id: 'setup', title: 'Company & Contact', description: 'Company, contact & address details', icon: '🏢' },
  { id: 'meters', title: 'Meters', description: 'Confirm meter details', icon: '⚡' },
  { id: 'details', title: 'Site Details', description: 'Energy consumption data', icon: '📊' },
  { id: 'loa', title: 'Authorisation', description: 'Letter of Authority', icon: '📋' },
];

const AddSite = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [siteData, setSiteData] = useState({
    setup: null, // Contains company, contact, and address
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
    navigate('/');
  };

  const renderStep = () => {
    switch (currentStepId) {
      case 'setup':
        return <CompanyContactAddressStep onNext={handleNext} initialData={siteData.setup} />;
      case 'meters':
        return <MeterStep onNext={handleNext} onBack={handleBack} address={siteData.setup?.address} initialData={siteData.meters} />;
      case 'details':
        return <SiteDetailsStep onNext={handleNext} onBack={handleBack} address={siteData.setup?.address} initialData={siteData.details} />;
      case 'loa':
        return <LoAStep onComplete={handleComplete} onBack={handleBack} siteData={siteData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <section className="bg-background border-b">
        <div className="container mx-auto px-6 py-8">
          <MockAuthStatus />
          
          <Button variant="ghost" asChild className="mb-6 hover:bg-primary/10">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Add New Site</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].description}
            </p>
            
            {/* Progress Section */}
            <div className="mb-8">
              <div className="flex justify-between mb-4">
                <div className="text-sm font-medium text-primary">
                  Progress: {Math.round(progress)}% complete
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentStep + 1} of {STEPS.length} steps
                </div>
              </div>
              <Progress value={progress} className="w-full h-3 mb-6" />
              
              {/* Step indicators */}
              <div className="hidden md:flex justify-between">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center space-y-2 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      index < currentStep 
                        ? 'bg-primary text-primary-foreground shadow-primary' 
                        : index === currentStep 
                        ? 'bg-primary/20 text-primary border-2 border-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {index < currentStep ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <span className="text-lg">{step.icon}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${
                        index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-muted-foreground hidden lg:block">
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-card border-0">
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{STEPS[currentStep].icon}</span>
                </div>
                <div>
                  <CardTitle className="text-2xl">{STEPS[currentStep].title}</CardTitle>
                  <CardDescription className="text-base">
                    {STEPS[currentStep].description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {renderStep()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddSite;