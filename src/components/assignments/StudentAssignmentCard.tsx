import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


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
  submission_grades?: Array<{
    teacher_grade?: number;
    overall_score?: number;
    teacher_feedback?: string;
    ai_feedback?: string;
  }>;
}

export function StudentAssignmentCard({ assignment, submission }: { 
  assignment: Assignment; 
  submission?: Submission;
}) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const dueDate = new Date(assignment.due_date);
  const isOverdue = dueDate < new Date();
  const hasSubmission = !!submission;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !assignment.file_types_allowed.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: `Please upload a file with one of these extensions: ${assignment.file_types_allowed.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > assignment.max_file_size_mb) {
      toast({
        title: "File Too Large",
        description: `File size must be less than ${assignment.max_file_size_mb}MB`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !profile?.user_id) return;

    setUploading(true);
    try {
      // Create file path: userId/assignmentId/filename
      const filePath = `${profile.user_id}/${assignment.id}/${selectedFile.name}`;
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignment-files')
        .upload(filePath, selectedFile, {
          upsert: true // Allow overwrite if resubmitting
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assignment-files')
        .getPublicUrl(filePath);

      // Create or update submission record
      const submissionData = {
        assignment_id: assignment.id,
        student_id: profile.user_id,
        file_url: publicUrl,
        file_name: selectedFile.name,
        file_size_mb: selectedFile.size / (1024 * 1024),
        status: 'submitted'
      };

      const { error: submissionError } = hasSubmission
        ? await supabase
            .from('submissions')
            .update(submissionData)
            .eq('id', submission.id)
        : await supabase
            .from('submissions')
            .insert([submissionData]);

      if (submissionError) throw submissionError;

      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been successfully uploaded!",
      });

      // Refresh the page to show updated submission
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload assignment",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const getSubmissionStatus = () => {
    if (!hasSubmission && isOverdue) {
      return { text: "Not Submitted (Overdue)", variant: "destructive" as const, icon: AlertCircle };
    }
    if (!hasSubmission) {
      return { text: "Not Submitted", variant: "secondary" as const, icon: Clock };
    }
    if (submission.status === 'graded') {
      return { text: "Graded", variant: "default" as const, icon: CheckCircle };
    }
    return { text: "Submitted", variant: "default" as const, icon: CheckCircle };
  };

  const statusInfo = getSubmissionStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            <CardDescription className="mt-1">
              {assignment.course_name} • Due: {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {statusInfo.text}
            </Badge>
            {assignment.max_points && (
              <span className="text-sm text-muted-foreground">
                {assignment.max_points} pts
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignment.description && (
          <p className="text-sm text-muted-foreground">
            {assignment.description}
          </p>
        )}

        {assignment.instructions && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Instructions:</h4>
            <p className="text-sm text-muted-foreground">
              {assignment.instructions}
            </p>
          </div>
        )}

        {hasSubmission && (
          <div className="space-y-4">
            <div className="bg-primary/5 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Your Submission
              </h4>
              <p className="text-sm">
                File: {submission.file_name}
              </p>
              <p className="text-sm text-muted-foreground">
                Submitted: {new Date(submission.submitted_at).toLocaleString()}
              </p>
              {(() => {
                const gradeData = submission.submission_grades?.[0];
                const finalGrade = gradeData?.teacher_grade ?? gradeData?.overall_score ?? submission.grade;
                const finalFeedback = gradeData?.teacher_feedback ?? gradeData?.ai_feedback ?? submission.feedback;
                
                return (
                  <>
                    {finalGrade && (
                      <p className="text-sm font-medium text-primary">
                        Grade: {finalGrade}/{assignment.max_points}
                      </p>
                    )}
                    {finalFeedback && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Feedback:</p>
                        <p className="text-sm text-muted-foreground">{finalFeedback}</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {!isOverdue && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label htmlFor={`file-${assignment.id}`} className="text-sm font-medium">
                {hasSubmission ? 'Resubmit Assignment:' : 'Upload Assignment:'}
              </Label>
            </div>
            
            <div className="flex items-center gap-3">
              <Input
                id={`file-${assignment.id}`}
                type="file"
                accept={assignment.file_types_allowed.map(ext => `.${ext}`).join(',')}
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                size="sm"
              >
                {uploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {hasSubmission ? 'Resubmit' : 'Submit'}
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Accepted formats: {assignment.file_types_allowed.join(', ')} • Max size: {assignment.max_file_size_mb}MB
            </p>
          </div>
        )}

        {isOverdue && !hasSubmission && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">
            This assignment is overdue and can no longer be submitted.
          </div>
        )}
      </CardContent>
    </Card>
  );
}