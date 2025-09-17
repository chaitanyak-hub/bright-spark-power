import BatteryOptimizerForm from '@/components/BatteryOptimizerForm';
import TestApiButton from '@/components/TestApiButton';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <TestApiButton />
        <BatteryOptimizerForm />
      </div>
    </div>
  );
};

export default Index;
