import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Brain, 
  Star, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Plus,
  Trash2,
  Edit,
  Award,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

interface Submission {
  id: string;
  file_name: string;
  file_url: string;
  submitted_at: string;
  status: string;
  assignment: {
    title: string;
    max_points: number;
    course_name: string;
  };
  student: {
    full_name: string;
  };
}

interface SubmissionGrade {
  id: string;
  ai_review: string;
  ai_grade: number;
  ai_feedback: string;
  teacher_review?: string;
  teacher_grade?: number;
  teacher_feedback?: string;
  strengths: string[];
  improvements: string[];
  grammar_score: number;
  content_score: number;
  structure_score: number;
  creativity_score: number;
  overall_score: number;
  graded_at?: string;
  created_at: string;
}

interface Rubric {
  id: string;
  name: string;
  description: string;
  total_points: number;
  criteria: RubricCriteria[];
}

interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  max_points: number;
  order_index: number;
}

export const GradingInterface = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [submissionGrade, setSubmissionGrade] = useState<SubmissionGrade | null>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    if (profile?.role === 'teacher') {
      fetchSubmissions();
      fetchRubrics();
    }
  }, [profile]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          assignment:assignments(title, max_points, course_name),
          student:profiles!submissions_student_id_fkey(full_name)
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRubrics = async () => {
    try {
      const { data, error } = await supabase
        .from('rubrics')
        .select(`
          *,
          criteria:rubric_criteria(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRubrics(data || []);
    } catch (error: any) {
      console.error('Error fetching rubrics:', error);
    }
  };

  const fetchSubmissionGrade = async (submissionId: string) => {
    try {
      const { data, error } = await supabase
        .from('submission_grades')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSubmissionGrade(data);
    } catch (error: any) {
      console.error('Error fetching submission grade:', error);
    }
  };

  const handleAIGrading = async () => {
    if (!selectedSubmission) return;

    setGrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-grade-submission', {
        body: {
          submissionId: selectedSubmission.id,
          rubricId: selectedRubric || null
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI grading completed successfully",
      });

      // Refresh the submission grade
      await fetchSubmissionGrade(selectedSubmission.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to grade submission",
        variant: "destructive",
      });
    } finally {
      setGrading(false);
    }
  };

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    fetchSubmissionGrade(submission.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI-Powered Grading</h1>
          <p className="text-muted-foreground">
            Review and grade student submissions with AI assistance
          </p>
        </div>
        <div className="flex gap-2">
          <RubricManager onRubricCreated={fetchRubrics} />
          <AnalyticsDashboard />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {submissions.length === 0 ? (
              <p className="text-center text-muted-foreground">No submissions to review</p>
            ) : (
              submissions.map((submission) => (
                <Card 
                  key={submission.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedSubmission?.id === submission.id ? 'border-primary' : ''
                  }`}
                  onClick={() => handleSelectSubmission(submission)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">{submission.student.full_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {submission.assignment.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {submission.assignment.course_name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(submission.submitted_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Grading Interface */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {selectedSubmission ? `Grading: ${selectedSubmission.student.full_name}` : 'Select a Submission'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSubmission ? (
              <Tabs defaultValue="review" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="review">AI Review</TabsTrigger>
                  <TabsTrigger value="grade">Grade & Feedback</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="review" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label>Select Rubric (Optional)</Label>
                      <Select value={selectedRubric} onValueChange={setSelectedRubric}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Choose a rubric" />
                        </SelectTrigger>
                        <SelectContent>
                          {rubrics.map((rubric) => (
                            <SelectItem key={rubric.id} value={rubric.id}>
                              {rubric.name} ({rubric.total_points} pts)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleAIGrading} 
                      disabled={grading}
                      className="w-full"
                    >
                      {grading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          AI is grading...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Start AI Grading
                        </>
                      )}
                    </Button>

                    {submissionGrade && (
                      <AIGradeDisplay grade={submissionGrade} maxPoints={selectedSubmission.assignment.max_points} />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="grade" className="space-y-4">
                  {submissionGrade ? (
                    <TeacherGradingForm 
                      submissionGrade={submissionGrade} 
                      maxPoints={selectedSubmission.assignment.max_points}
                      onGradeUpdate={() => fetchSubmissionGrade(selectedSubmission.id)}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Run AI grading first to begin manual review</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  {submissionGrade && (
                    <GradeAnalytics grade={submissionGrade} />
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a submission to start grading</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AIGradeDisplay = ({ grade, maxPoints }: { grade: SubmissionGrade; maxPoints: number }) => {
  const percentage = Math.round((grade.overall_score / maxPoints) * 100);
  
  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">AI Assessment</h3>
        <Badge variant={percentage >= 80 ? "default" : percentage >= 70 ? "secondary" : "destructive"}>
          {grade.overall_score}/{maxPoints} ({percentage}%)
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Content Quality</Label>
          <Progress value={(grade.content_score / 25) * 100} className="h-2" />
          <span className="text-xs text-muted-foreground">{grade.content_score}/25</span>
        </div>
        <div>
          <Label className="text-sm">Structure</Label>
          <Progress value={(grade.structure_score / 25) * 100} className="h-2" />
          <span className="text-xs text-muted-foreground">{grade.structure_score}/25</span>
        </div>
        <div>
          <Label className="text-sm">Grammar</Label>
          <Progress value={(grade.grammar_score / 25) * 100} className="h-2" />
          <span className="text-xs text-muted-foreground">{grade.grammar_score}/25</span>
        </div>
        <div>
          <Label className="text-sm">Creativity</Label>
          <Progress value={(grade.creativity_score / 25) * 100} className="h-2" />
          <span className="text-xs text-muted-foreground">{grade.creativity_score}/25</span>
        </div>
      </div>

      {grade.ai_feedback && (
        <div>
          <Label className="text-sm font-medium">AI Feedback</Label>
          <p className="text-sm mt-1">{grade.ai_feedback}</p>
        </div>
      )}

      {grade.strengths && grade.strengths.length > 0 && (
        <div>
          <Label className="text-sm font-medium flex items-center gap-1">
            <Star className="h-3 w-3" />
            Strengths
          </Label>
          <ul className="text-sm mt-1 space-y-1">
            {grade.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {grade.improvements && grade.improvements.length > 0 && (
        <div>
          <Label className="text-sm font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Areas for Improvement
          </Label>
          <ul className="text-sm mt-1 space-y-1">
            {grade.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-2">
                <Clock className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const TeacherGradingForm = ({ 
  submissionGrade, 
  maxPoints, 
  onGradeUpdate 
}: { 
  submissionGrade: SubmissionGrade; 
  maxPoints: number; 
  onGradeUpdate: () => void; 
}) => {
  const { toast } = useToast();
  const [teacherGrade, setTeacherGrade] = useState(submissionGrade.teacher_grade || submissionGrade.ai_grade);
  const [teacherFeedback, setTeacherFeedback] = useState(submissionGrade.teacher_feedback || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('submission_grades')
        .update({
          teacher_grade: teacherGrade,
          teacher_feedback: teacherFeedback,
          graded_at: new Date().toISOString()
        })
        .eq('id', submissionGrade.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Grade submitted successfully",
      });

      onGradeUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit grade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="teacher-grade">Final Grade (out of {maxPoints})</Label>
        <Input
          id="teacher-grade"
          type="number"
          min="0"
          max={maxPoints}
          value={teacherGrade}
          onChange={(e) => setTeacherGrade(Number(e.target.value))}
          required
        />
      </div>

      <div>
        <Label htmlFor="teacher-feedback">Teacher Feedback</Label>
        <Textarea
          id="teacher-feedback"
          value={teacherFeedback}
          onChange={(e) => setTeacherFeedback(e.target.value)}
          placeholder="Provide additional feedback for the student..."
          className="min-h-[100px]"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Submitting..." : "Submit Final Grade"}
      </Button>
    </form>
  );
};

const GradeAnalytics = ({ grade }: { grade: SubmissionGrade }) => {
  const componentScores = [
    { name: 'Content', score: grade.content_score, max: 25 },
    { name: 'Structure', score: grade.structure_score, max: 25 },
    { name: 'Grammar', score: grade.grammar_score, max: 25 },
    { name: 'Creativity', score: grade.creativity_score, max: 25 },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Performance Breakdown</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {componentScores.map((component) => {
          const percentage = (component.score / component.max) * 100;
          return (
            <Card key={component.name}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{component.name}</span>
                  <span className="text-sm">{component.score}/{component.max}</span>
                </div>
                <Progress value={percentage} className="h-2" />
                <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Strengths Identified</p>
            <p className="text-2xl font-bold">{grade.strengths?.length || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Improvement Areas</p>
            <p className="text-2xl font-bold">{grade.improvements?.length || 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const RubricManager = ({ onRubricCreated }: { onRubricCreated: () => void }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Manage Rubrics
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Rubric Management</DialogTitle>
        </DialogHeader>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Rubric management interface coming soon...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AnalyticsDashboard = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Grading Analytics</DialogTitle>
        </DialogHeader>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};