import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { FileText, Users, CheckCircle, Clock, Plus, BarChart3, MessageSquare, Calendar, AlertTriangle, Shield, Eye, MessageCircle } from 'lucide-react';
import { MessageList, ComposeMessageDialog } from '@/components/messaging/MessageComponents';
import PlagiarismResultsDialog from '@/components/grading/PlagiarismResultsDialog';
import GradingResultsDialog from '@/components/grading/GradingResultsDialog';
import TeacherAssignmentCalendar from '@/components/calendar/TeacherAssignmentCalendar';
import { CreateAssignmentDialog } from '@/components/assignments/AssignmentComponents';
export function TeacherDashboard() {
  const {
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalSubmissions: 0,
    pendingGrading: 0,
    activeStudents: 0,
    gradedSubmissions: 0
  });
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [checkingPlagiarism, setCheckingPlagiarism] = useState<Set<string>>(new Set());
  const [plagiarismResults, setPlagiarismResults] = useState<any>(null);
  const [plagiarismDialogOpen, setPlagiarismDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [gradingResults, setGradingResults] = useState<any>(null);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (profile?.role === 'teacher') {
      fetchDashboardData();
    }
  }, [profile]);
  const handlePlagiarismCheck = async (submissionId: string, fileUrl: string) => {
    setCheckingPlagiarism(prev => new Set([...prev, submissionId]));
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('check-plagiarism', {
        body: {
          submissionId,
          fileUrl
        }
      });
      if (error) throw error;
      console.log('Plagiarism check result:', data);
      if (data.plagiarismAnalysis) {
        // Find the submission details for the dialog
        const submission = pendingReviews.find(review => review.id === submissionId);
        setSelectedSubmission(submission);
        setPlagiarismResults(data.plagiarismAnalysis);
        setPlagiarismDialogOpen(true);
        toast({
          title: "Plagiarism Analysis Complete",
          description: `Risk score: ${data.plagiarismAnalysis.riskScore}%`,
          variant: data.plagiarismAnalysis.riskScore > 70 ? 'destructive' : 'default'
        });
      }

      // Refresh data to show updated plagiarism results
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Plagiarism check failed:', error);
      toast({
        title: "Plagiarism Check Failed",
        description: error.message || "Failed to analyze submission for plagiarism.",
        variant: "destructive"
      });
    } finally {
      setCheckingPlagiarism(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };
  const handleGradeSubmission = async (submissionId: string) => {
    setGradingSubmission(prev => new Set([...prev, submissionId]));
    try {
      // Find the submission to get the assignment ID
      const submission = pendingReviews.find(review => review.id === submissionId);
      const assignmentId = submission?.assignment_id;
      if (!assignmentId) {
        throw new Error('Assignment ID not found for submission');
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-grade-submission', {
        body: {
          submissionId,
          assignmentId
        }
      });
      if (error) throw error;
      console.log('Grading result:', data);
      if (data.success) {
        // Find the submission details for the dialog
        const submission = pendingReviews.find(review => review.id === submissionId);
        setSelectedSubmission(submission);
        setGradingResults(data);
        setGradingDialogOpen(true);
        toast({
          title: "AI Grading Complete",
          description: data.message,
          variant: 'default'
        });

        // Refresh data to show updated grades
        await fetchDashboardData();
      }
    } catch (error: any) {
      console.error('Grading failed:', error);
      toast({
        title: "Grading Failed",
        description: error.message || "Failed to grade submission with AI.",
        variant: "destructive"
      });
    } finally {
      setGradingSubmission(prev => {
        const newSet = new Set(prev);
        newSet.delete(submissionId);
        return newSet;
      });
    }
  };
  const getPlagiarismInfo = (teacherComments: string | null, plagiarismScore: number | null) => {
    // Check if plagiarism analysis exists
    if (plagiarismScore !== null) {
      return {
        score: plagiarismScore,
        isPlagiarized: plagiarismScore > 70,
        checked: true
      };
    }

    // Fallback to teacher comments parsing
    if (!teacherComments) return null;
    try {
      const comments = JSON.parse(teacherComments);
      if (comments.plagiarism_checked) {
        return {
          score: comments.plagiarism_score || 0,
          isPlagiarized: comments.is_plagiarized || false,
          checked: true
        };
      }
    } catch {
      // Not JSON or no plagiarism data
    }
    return null;
  };
  const fetchDashboardData = async () => {
    try {
      // Fetch assignments created by this teacher only
      const {
        data: assignments
      } = await supabase.from('assignments').select('*').eq('created_by', profile?.user_id).order('created_at', {
        ascending: false
      });

      // Fetch submissions for this teacher's assignments only
      const {
        data: submissions
      } = await supabase.from('submissions').select(`
          *,
          assignment:assignments!inner(title, course_name, created_by),
          student:profiles!submissions_student_id_fkey(full_name)
        `).eq('assignment.created_by', profile?.user_id);
      const totalAssignments = assignments?.length || 0;
      const totalSubmissions = submissions?.length || 0;
      const pendingGrading = submissions?.filter(sub => sub.status === 'submitted').length || 0;
      const gradedSubmissions = submissions?.filter(sub => sub.status === 'graded').length || 0;

      // Get unique students who have submitted
      const activeStudents = new Set(submissions?.map(sub => sub.student_id)).size;
      setStats({
        totalAssignments,
        totalSubmissions,
        pendingGrading,
        activeStudents,
        gradedSubmissions
      });
      setRecentAssignments(assignments?.slice(0, 3) || []);
      // Show all submissions with status 'submitted' or 'plagiarism_checked' for review
      setPendingReviews(submissions?.filter(sub => sub.status === 'submitted' || sub.status === 'plagiarism_checked').slice(0, 5) || []);

      // Store gradedSubmissions for use in the stats display
      (window as any).gradedSubmissions = gradedSubmissions;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Manage assignments, track student progress, and provide feedback
          </p>
        </div>
        <CreateAssignmentDialog />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Total created
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              Students with submissions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded Submissions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gradedSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Completed reviews
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingGrading}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Calendar */}
      <TeacherAssignmentCalendar />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
            <CardDescription>
              Latest assignments and their status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAssignments.length === 0 ? <p className="text-muted-foreground">No assignments created yet</p> : recentAssignments.map(assignment => <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{assignment.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {assignment.course_name} • Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                    {assignment.status}
                  </Badge>
                </div>)}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        
      </div>

      {/* Pending Reviews with Plagiarism Checking */}
      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
        <CardDescription>
          Review submissions and grade them using AI analysis. Completed reviews will be marked as graded.
        </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingReviews.length === 0 ? <p className="text-muted-foreground">No submissions to review</p> : pendingReviews.map(review => {
            const plagiarismInfo = getPlagiarismInfo(review.teacher_comments, review.plagiarism_score);
            const isChecking = checkingPlagiarism.has(review.id);
            const isGrading = gradingSubmission.has(review.id);
            return <div key={review.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{review.student?.full_name || 'Unknown Student'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {review.assignment?.title || 'Unknown Assignment'} • Submitted {new Date(review.submitted_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          File: {review.file_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={review.status === 'graded' ? 'default' : 'secondary'}>
                          {review.status === 'graded' ? 'Graded' : 'Submitted'}
                        </Badge>
                        {plagiarismInfo ? <Badge variant={plagiarismInfo.isPlagiarized ? "destructive" : "default"} className="flex items-center gap-1">
                            {plagiarismInfo.isPlagiarized ? <AlertTriangle className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                            {plagiarismInfo.score}% plagiarism
                          </Badge> : <Badge variant="secondary">Not checked</Badge>}
                        {review.grade && <Badge variant="outline" className="bg-green-50 text-green-700">
                            {review.grade}/{review.assignment?.max_points || 100}
                          </Badge>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handlePlagiarismCheck(review.id, review.file_url)} disabled={isChecking}>
                        {isChecking ? <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                            Checking...
                          </> : <>
                            <Shield className="h-3 w-3 mr-2" />
                            {plagiarismInfo ? 'Re-check' : 'Check Plagiarism'}
                          </>}
                      </Button>
                      
                      <Button size="sm" onClick={() => handleGradeSubmission(review.id)} disabled={isGrading || review.status === 'graded'} variant={review.status === 'graded' ? 'outline' : 'default'}>
                        {isGrading ? <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Grading...
                          </> : review.status === 'graded' ? <>
                            <CheckCircle className="h-3 w-3 mr-2" />
                            View Grade
                          </> : <>
                            <Eye className="h-3 w-3 mr-2" />
                            Review & Grade
                          </>}
                      </Button>
                      
                      <ComposeMessageDialog preselectedRecipient={review.student_id} />
                      
                      {review.file_url && <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    // Use Supabase storage download method for better access control
                    const filePath = review.file_url.split('/assignment-files/')[1];
                    if (filePath) {
                      const {
                        data,
                        error
                      } = await supabase.storage.from('assignment-files').createSignedUrl(filePath, 3600); // 1 hour expiry

                      if (error) {
                        console.error('Error creating signed URL:', error);
                        // Fallback to direct URL
                        window.open(review.file_url, '_blank');
                      } else {
                        window.open(data.signedUrl, '_blank');
                      }
                    } else {
                      window.open(review.file_url, '_blank');
                    }
                  } catch (error) {
                    console.error('Error opening file:', error);
                    // Fallback to direct URL
                    window.open(review.file_url, '_blank');
                  }
                }}>
                          <FileText className="h-3 w-3 mr-2" />
                          View File
                        </Button>}
                    </div>

                    {plagiarismInfo && plagiarismInfo.isPlagiarized && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20">
                        <div className="flex items-center gap-2 font-medium">
                          <AlertTriangle className="h-4 w-4" />
                          High Plagiarism Detected
                        </div>
                        <p className="mt-1">
                          This submission shows {plagiarismInfo.score}% similarity to existing sources. 
                          Please review carefully before grading.
                        </p>
                      </div>}
                  </div>;
          })}
          </div>
        </CardContent>
      </Card>

      {/* Messages Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </CardTitle>
          <ComposeMessageDialog />
        </CardHeader>
        <CardContent>
          <MessageList />
        </CardContent>
      </Card>

      <PlagiarismResultsDialog open={plagiarismDialogOpen} onOpenChange={setPlagiarismDialogOpen} results={plagiarismResults} studentName={selectedSubmission?.student?.full_name} assignmentTitle={selectedSubmission?.assignment?.title} />

      <GradingResultsDialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen} results={gradingResults} submissionInfo={selectedSubmission ? {
      studentName: selectedSubmission.student?.full_name || 'Unknown Student',
      studentId: selectedSubmission.student_id,
      submissionId: selectedSubmission.id,
      assignmentTitle: selectedSubmission.assignment?.title || 'Unknown Assignment',
      maxPoints: selectedSubmission.assignment?.max_points || 100,
      submittedAt: selectedSubmission.submitted_at,
      fileName: selectedSubmission.file_name
    } : undefined} />
    </div>;
}