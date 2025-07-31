import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Upload
} from 'lucide-react';
import AssignmentCalendar from '@/components/calendar/AssignmentCalendar';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_name: string;
  max_points: number;
  status: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  file_name: string;
  submitted_at: string;
  status: string;
  grade?: number;
}

export function StudentDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    averageGrade: 0,
    dueSoon: 0
  });
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile?.role === 'student') {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'active')
        .order('due_date', { ascending: true });

      // Fetch user's submissions
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', profile?.user_id);

      const assignmentsList = assignmentsData || [];
      const submissionsList = submissionsData || [];

      setAssignments(assignmentsList);
      setSubmissions(submissionsList);

      // Calculate stats
      const totalAssignments = assignmentsList.length;
      const completedAssignments = submissionsList.filter(sub => sub.status !== 'draft').length;
      const gradedSubmissions = submissionsList.filter(sub => sub.grade !== null);
      const averageGrade = gradedSubmissions.length > 0 
        ? gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0) / gradedSubmissions.length 
        : 0;
      
      const now = new Date();
      const dueSoon = assignmentsList.filter(assignment => {
        const dueDate = new Date(assignment.due_date);
        const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        const hasSubmission = submissionsList.some(sub => sub.assignment_id === assignment.id);
        return daysUntilDue <= 2 && daysUntilDue > 0 && !hasSubmission;
      }).length;

      setStats({
        totalAssignments,
        completedAssignments,
        averageGrade: Math.round(averageGrade),
        dueSoon
      });

      // Get recent feedback
      const recentGraded = submissionsList
        .filter(sub => sub.status === 'graded' && sub.grade !== null)
        .slice(0, 3);
      
      setRecentFeedback(recentGraded);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (assignmentId: string, file: File) => {
    if (!profile?.user_id) return;

    setUploadingFiles(prev => new Set([...prev, assignmentId]));

    try {
      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedTypes = ['pdf', 'doc', 'docx', 'txt'];
      
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        throw new Error('Please upload a PDF, DOC, DOCX, or TXT file');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      // Create file path
      const filePath = `${profile.user_id}/${assignmentId}/${file.name}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('assignment-files')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assignment-files')
        .getPublicUrl(filePath);

      // Create or update submission
      const submissionData = {
        assignment_id: assignmentId,
        student_id: profile.user_id,
        file_url: publicUrl,
        file_name: file.name,
        file_size_mb: file.size / (1024 * 1024),
        status: 'submitted'
      };

      const existingSubmission = submissions.find(sub => sub.assignment_id === assignmentId);

      if (existingSubmission) {
        const { error } = await supabase
          .from('submissions')
          .update(submissionData)
          .eq('id', existingSubmission.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('submissions')
          .insert([submissionData]);
        
        if (error) throw error;
      }

      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been uploaded successfully!",
      });

      // Refresh data
      fetchDashboardData();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(assignmentId);
        return newSet;
      });
    }
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(sub => sub.assignment_id === assignmentId);
  };

  const upcomingAssignments = assignments.filter(assignment => {
    const dueDate = new Date(assignment.due_date);
    const submission = getSubmissionForAssignment(assignment.id);
    return dueDate >= new Date() && !submission;
  }).slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">
            Track your assignments, progress, and upcoming deadlines
          </p>
        </div>
        <Link to="/assignments">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            View All Assignments
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Available assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAssignments > 0 ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageGrade}%</div>
            <p className="text-xs text-muted-foreground">
              Average across {submissions.filter(s => s.grade !== null).length} graded assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dueSoon}</div>
            <p className="text-xs text-muted-foreground">
              Due within 48 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Calendar - Full Width */}
      <AssignmentCalendar />

      {/* Upcoming Assignments and Course Progress */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Assignments with Quick Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Submit - Upcoming Assignments</CardTitle>
            <CardDescription>
              Upload assignments directly from your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAssignments.length === 0 ? (
              <p className="text-muted-foreground">No upcoming assignments</p>
            ) : (
              upcomingAssignments.map((assignment) => {
                const dueDate = new Date(assignment.due_date);
                const isOverdue = dueDate < new Date();
                const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                const isUploading = uploadingFiles.has(assignment.id);

                return (
                  <div key={assignment.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {assignment.course_name} • Due: {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <Badge variant={isOverdue ? "destructive" : daysUntilDue <= 2 ? "secondary" : "default"}>
                        {isOverdue ? "Overdue" : daysUntilDue <= 2 ? `${daysUntilDue} days left` : "Upcoming"}
                      </Badge>
                    </div>
                    
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground">{assignment.description}</p>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(assignment.id, file);
                          }
                        }}
                        disabled={isUploading || isOverdue}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground">
                        PDF, DOC, DOCX, TXT (max 10MB)
                      </span>
                    </div>
                    
                    {isUploading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Uploading...
                      </div>
                    )}
                    
                    {isOverdue && (
                      <div className="p-2 bg-destructive/10 text-destructive text-sm rounded">
                        This assignment is overdue
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <CardDescription>
              Your progress in each course
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              // Group assignments by course
              const courseProgress = assignments.reduce((acc, assignment) => {
                const course = assignment.course_name;
                if (!acc[course]) {
                  acc[course] = { total: 0, completed: 0 };
                }
                acc[course].total += 1;
                if (getSubmissionForAssignment(assignment.id)) {
                  acc[course].completed += 1;
                }
                return acc;
              }, {} as Record<string, { total: number; completed: number }>);

              return Object.entries(courseProgress).length === 0 ? (
                <p className="text-muted-foreground">No courses with assignments yet</p>
              ) : (
                Object.entries(courseProgress).map(([course, progress]) => {
                  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
                  return (
                    <div key={course} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{course}</h4>
                        <span className="text-sm text-muted-foreground">{progress.completed}/{progress.total}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-sm text-muted-foreground">{percentage}% complete</p>
                    </div>
                  );
                })
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>
            Latest feedback from your teachers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentFeedback.length === 0 ? (
              <p className="text-muted-foreground">No graded assignments yet</p>
            ) : (
              recentFeedback.map((feedback) => {
                const assignment = assignments.find(a => a.id === feedback.assignment_id);
                return (
                  <div key={feedback.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{assignment?.title || 'Unknown Assignment'}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{feedback.grade}%</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(feedback.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {feedback.feedback && (
                      <p className="text-sm text-muted-foreground">{feedback.feedback}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Course: {assignment?.course_name || 'Unknown Course'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}