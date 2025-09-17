import { useMockAuth } from '@/contexts/MockAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, LogOut, LogIn } from 'lucide-react';

const MockAuthStatus = () => {
  const { user, isLoading, signIn, signOut } = useMockAuth();

  if (isLoading) {
    return (
      <Card className="mb-4 border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
            <span className="text-sm text-orange-700">Loading authentication...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
          <User className="mr-2 h-4 w-4" />
          Development Authentication
        </CardTitle>
        <CardDescription className="text-xs text-blue-600">
          Mock authentication for development and testing
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium text-blue-800">
                {user.user_metadata.first_name} {user.user_metadata.last_name}
              </div>
              <div className="text-blue-600">{user.email}</div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <LogOut className="mr-1 h-3 w-3" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">Not authenticated</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signIn}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <LogIn className="mr-1 h-3 w-3" />
              Sign In
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MockAuthStatus;