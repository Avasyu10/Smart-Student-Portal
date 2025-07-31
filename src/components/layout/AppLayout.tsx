import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface AppLayoutProps {
  children: ReactNode;
  allowedRoles?: ('student' | 'teacher')[];
}

export function AppLayout({ children, allowedRoles }: AppLayoutProps) {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // If user is authenticated but profile doesn't match allowed roles
    if (user && profile && allowedRoles && !allowedRoles.includes(profile.role as 'student' | 'teacher')) {
      toast({
        title: "Access Denied",
        description: `This area is restricted to ${allowedRoles.join(' and ')} accounts only.`,
        variant: "destructive"
      });
    }
  }, [user, profile, allowedRoles, toast]);

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

  if (!user) {
    return <Navigate to="/home" replace />;
  }

  if (profile && allowedRoles && !allowedRoles.includes(profile.role as 'student' | 'teacher')) {
    // Redirect to appropriate auth page based on role
    if (profile.role === 'student') {
      return <Navigate to="/student-auth" replace />;
    } else if (profile.role === 'teacher') {
      return <Navigate to="/teacher-auth" replace />;
    }
    return <Navigate to="/home" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}