import { useState, useEffect } from 'react';
import { StudentAssignmentCard } from '@/components/assignments/StudentAssignmentCard';
import { TeacherSelectionDialog } from '@/components/assignments/TeacherSelectionDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_name: string;
  max_points: number;
  instructions: string;
  file_types_allowed: string[];
  max_file_size_mb: number;
  status: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  file_name: string;
  file_size_mb: number;
  submitted_at: string;
  status: string;
  grade?: number;
  feedback?: string;
}

const StudentAssignments = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.role === 'student') {
      fetchSelectedTeachers();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedTeachers.length > 0) {
      fetchData();
    }
  }, [selectedTeachers]);

  const fetchSelectedTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('student_teachers')
        .select('teacher_id')
        .eq('student_id', profile?.user_id)
        .eq('status', 'active');

      if (error) throw error;
      const teacherIds = data?.map(st => st.teacher_id) || [];
      setSelectedTeachers(teacherIds);
      
      if (teacherIds.length === 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching selected teachers:', error);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (selectedTeachers.length === 0) {
      setAssignments([]);
      setSubmissions([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch assignments from selected teachers only
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'active')
        .in('created_by', selectedTeachers)
        .order('due_date', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Fetch user's submissions with final grades
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          submission_grades (
            teacher_grade,
            overall_score,
            teacher_feedback,
            ai_feedback
          )
        `)
        .eq('student_id', profile?.user_id);

      if (submissionsError) throw submissionsError;

      setAssignments(assignmentsData || []);
      setSubmissions(submissionsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeachersUpdated = () => {
    fetchSelectedTeachers();
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(sub => sub.assignment_id === assignmentId);
  };

  const upcomingAssignments = assignments.filter(assignment => {
    const dueDate = new Date(assignment.due_date);
    const submission = getSubmissionForAssignment(assignment.id);
    return dueDate >= new Date() && !submission;
  });

  const submittedAssignments = assignments.filter(assignment => {
    const submission = getSubmissionForAssignment(assignment.id);
    return !!submission;
  });

  const overdueAssignments = assignments.filter(assignment => {
    const dueDate = new Date(assignment.due_date);
    const submission = getSubmissionForAssignment(assignment.id);
    return dueDate < new Date() && !submission;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (selectedTeachers.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Assignments</h1>
            <p className="text-muted-foreground">
              Select your teachers to view assignments
            </p>
          </div>
          <TeacherSelectionDialog onTeachersUpdated={handleTeachersUpdated} />
        </div>
        
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No teachers selected</h3>
          <p className="text-muted-foreground mb-4">
            You need to select your teachers first to see assignments
          </p>
          <TeacherSelectionDialog onTeachersUpdated={handleTeachersUpdated} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground">
            View and submit your assignments
          </p>
        </div>
        <TeacherSelectionDialog onTeachersUpdated={handleTeachersUpdated} />
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted ({submittedAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({overdueAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAssignments.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No upcoming assignments</h3>
              <p className="text-muted-foreground">
                You're all caught up! Check back later for new assignments.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {upcomingAssignments.map((assignment) => (
                <StudentAssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  submission={getSubmissionForAssignment(assignment.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {submittedAssignments.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No submitted assignments</h3>
              <p className="text-muted-foreground">
                Your submitted assignments will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {submittedAssignments.map((assignment) => (
                <StudentAssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  submission={getSubmissionForAssignment(assignment.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overdueAssignments.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No overdue assignments</h3>
              <p className="text-muted-foreground">
                Great job staying on top of your work!
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {overdueAssignments.map((assignment) => (
                <StudentAssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  submission={getSubmissionForAssignment(assignment.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentAssignments;