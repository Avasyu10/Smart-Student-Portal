import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StudentAuth from "./pages/StudentAuth";
import TeacherAuth from "./pages/TeacherAuth";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import AssignmentRouter from "./components/assignments/AssignmentRouter";
import Messages from "./pages/Messages";
import Calendar from "./pages/Calendar";
import Grading from "./pages/Grading";
import Rubrics from "./pages/Rubrics";
import Students from "./pages/Students";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/student-auth" element={<StudentAuth />} />
            <Route path="/teacher-auth" element={<TeacherAuth />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/home" element={<Index />} />
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={
              <AppLayout allowedRoles={['student', 'teacher']}>
                <Dashboard />
              </AppLayout>
            } />
            <Route path="/assignments" element={
              <AppLayout allowedRoles={['student', 'teacher']}>
                <AssignmentRouter />
              </AppLayout>
            } />
            <Route path="/messages" element={
              <AppLayout allowedRoles={['student', 'teacher']}>
                <Messages />
              </AppLayout>
            } />
            <Route path="/calendar" element={
              <AppLayout allowedRoles={['student', 'teacher']}>
                <Calendar />
              </AppLayout>
            } />
            <Route path="/grading" element={
              <AppLayout allowedRoles={['teacher']}>
                <Grading />
              </AppLayout>
            } />
            <Route path="/rubrics" element={
              <AppLayout allowedRoles={['teacher']}>
                <Rubrics />
              </AppLayout>
            } />
            <Route path="/students" element={
              <AppLayout allowedRoles={['teacher']}>
                <Students />
              </AppLayout>
            } />
            <Route path="/profile" element={
              <AppLayout allowedRoles={['student', 'teacher']}>
                <Profile />
              </AppLayout>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
