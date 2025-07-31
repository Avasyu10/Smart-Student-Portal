import { useAuth } from '@/hooks/useAuth';
import TeacherAssignments from '@/pages/TeacherAssignments';
import StudentAssignments from '@/pages/StudentAssignments';

const AssignmentRouter = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (profile?.role === 'teacher') {
    return <TeacherAssignments />;
  }

  if (profile?.role === 'student') {
    return <StudentAssignments />;
  }

  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium mb-2">Access Denied</h3>
      <p className="text-muted-foreground">
        You need to be logged in to view assignments.
      </p>
    </div>
  );
};

export default AssignmentRouter;