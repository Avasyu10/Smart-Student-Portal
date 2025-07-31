import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, Users } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'student' | 'teacher'>('student');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    
    // Always set role to teacher for signup from frontend
    await signUp(email, password, fullName, 'teacher');
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-200 via-violet-100 to-purple-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Smart Student Portal</CardTitle>
          <CardDescription>
            Access your assignments and grading dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Select User Type</Label>
            <RadioGroup 
              value={userType} 
              onValueChange={(value: 'student' | 'teacher') => {
                setUserType(value);
                setAuthMode('login'); // Reset to login when user type changes
              }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student" className="flex items-center cursor-pointer">
                  <Users className="h-4 w-4 mr-2" />
                  Student
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="teacher" id="teacher" />
                <Label htmlFor="teacher" className="flex items-center cursor-pointer">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Teacher
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Auth Mode Selection for Teachers */}
          {userType === 'teacher' && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant={authMode === 'login' ? 'default' : 'outline'}
                onClick={() => setAuthMode('login')}
                className="flex-1"
              >
                Login
              </Button>
              <Button
                type="button"
                variant={authMode === 'signup' ? 'default' : 'outline'}
                onClick={() => setAuthMode('signup')}
                className="flex-1"
              >
                Sign Up
              </Button>
            </div>
          )}

          {/* Info Message */}
          <div className={`p-3 rounded-lg ${
            userType === 'student' ? 'bg-muted/50' : 'bg-primary/10'
          }`}>
            <p className={`text-sm ${
              userType === 'student' ? 'text-muted-foreground' : 'text-primary'
            }`}>
              {userType === 'student' ? (
                <>
                  <Users className="h-4 w-4 inline mr-2" />
                  Students: Use credentials provided by your teacher
                </>
              ) : (
                <>
                  <GraduationCap className="h-4 w-4 inline mr-2" />
                  Teachers: {authMode === 'login' ? 'Access your account' : 'Create your account and start managing assignments'}
                </>
              )}
            </p>
          </div>

          {/* Auth Forms */}
          {(userType === 'student' || authMode === 'login') && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input 
                  id="signin-email" 
                  name="email" 
                  type="email" 
                  placeholder={`Enter your ${userType} email`}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input 
                  id="signin-password" 
                  name="password" 
                  type="password" 
                  placeholder="Enter your password"
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : `Sign In as ${userType === 'student' ? 'Student' : 'Teacher'}`}
              </Button>
            </form>
          )}

          {userType === 'teacher' && authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input 
                  id="signup-name" 
                  name="fullName" 
                  type="text" 
                  placeholder="Enter your full name"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input 
                  id="signup-email" 
                  name="email" 
                  type="email" 
                  placeholder="Enter your email"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input 
                  id="signup-password" 
                  name="password" 
                  type="password" 
                  placeholder="Choose a password"
                  required 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Teacher Account"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;