import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, ArrowLeft } from 'lucide-react';

const TeacherAuth = () => {
  const { user, signIn, signUp, loading, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Redirect if already authenticated and is a teacher
  if (user && profile?.role === 'teacher') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect if authenticated but not a teacher
  if (user && profile?.role === 'student') {
    return <Navigate to="/student-auth" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      // Wait for profile to load and check role
      setTimeout(async () => {
        // Check if user profile is loaded and validate role
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();
          
          if (profileData?.role !== 'teacher') {
            await supabase.auth.signOut();
            toast({
              title: "Access Denied",
              description: "This login is for teachers only. Please use the student login if you are a student.",
              variant: "destructive"
            });
            setIsLoading(false);
            return;
          }
        }
        setIsLoading(false);
      }, 1500);
    } else {
      toast({
        title: "Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    
    const { error } = await signUp(email, password, fullName, 'teacher');
    
    if (!error) {
      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      });
    }
    
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
          <Link to="/home" className="flex items-center justify-center mb-4 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Teacher Portal</CardTitle>
          <CardDescription>
            Manage assignments and grade student work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auth Mode Selection */}
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

          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-primary">
              <GraduationCap className="h-4 w-4 inline mr-2" />
              Teachers: {authMode === 'login' ? 'Access your account' : 'Create your account to start managing assignments'}
            </p>
          </div>

          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacher-email">Teacher Email</Label>
                <Input 
                  id="teacher-email" 
                  name="email" 
                  type="email" 
                  placeholder="Enter your teacher email"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-password">Password</Label>
                <Input 
                  id="teacher-password" 
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
                {isLoading ? "Signing In..." : "Sign In as Teacher"}
              </Button>
            </form>
          )}

          {/* Signup Form */}
          {authMode === 'signup' && (
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

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Are you a student?{' '}
              <Link to="/student-auth" className="text-primary hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherAuth;