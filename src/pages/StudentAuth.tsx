import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, ArrowLeft } from 'lucide-react';

const StudentAuth = () => {
  const { user, signIn, loading, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated and is a student
  if (user && profile?.role === 'student') {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect if authenticated but not a student
  if (user && profile?.role === 'teacher') {
    return <Navigate to="/teacher-auth" replace />;
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
          
          if (profileData?.role !== 'student') {
            await supabase.auth.signOut();
            toast({
              title: "Access Denied",
              description: "This login is for students only. Please use the teacher login if you are a teacher.",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <Link to="/home" className="flex items-center justify-center mb-4 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-blue-800">Student Login</CardTitle>
          <CardDescription>
            Access your assignments and view your grades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <Users className="h-4 w-4 inline mr-2" />
              Students: Use the login credentials provided by your teacher
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-email">Student Email</Label>
              <Input 
                id="student-email" 
                name="email" 
                type="email" 
                placeholder="Enter your student email"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-password">Password</Label>
              <Input 
                id="student-password" 
                name="password" 
                type="password" 
                placeholder="Enter your password"
                required 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In as Student"}
            </Button>
          </form>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Are you a teacher?{' '}
              <Link to="/teacher-auth" className="text-primary hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAuth;