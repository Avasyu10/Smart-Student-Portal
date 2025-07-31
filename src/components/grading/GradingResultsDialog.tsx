import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Star, CheckCircle, TrendingUp, FileText, User, Calendar, MessageSquare, Edit3, Save } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GradingResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: {
    aiGrade: number;
    feedback: string;
    strengths?: string[];
    improvements?: string[];
    grammarScore?: number;
    contentScore?: number;
    structureScore?: number;
    creativityScore?: number;
    message?: string;
    note?: string;
  } | null;
  submissionInfo?: {
    studentName: string;
    studentId: string;
    submissionId: string;
    assignmentTitle: string;
    maxPoints: number;
    submittedAt: string;
    fileName: string;
  };
}

const GradingResultsDialog: React.FC<GradingResultsDialogProps> = ({
  open,
  onOpenChange,
  results,
  submissionInfo
}) => {
  const { toast } = useToast();
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  
  // Grade adjustment states
  const [isEditing, setIsEditing] = useState(false);
  const [adjustedGrade, setAdjustedGrade] = useState(results?.aiGrade || 0);
  const [adjustedFeedback, setAdjustedFeedback] = useState(results?.feedback || '');
  const [adjustedStrengths, setAdjustedStrengths] = useState<string[]>(results?.strengths || []);
  const [adjustedImprovements, setAdjustedImprovements] = useState<string[]>(results?.improvements || []);
  const [adjustedContentScore, setAdjustedContentScore] = useState(results?.contentScore || 0);
  const [adjustedStructureScore, setAdjustedStructureScore] = useState(results?.structureScore || 0);
  const [adjustedGrammarScore, setAdjustedGrammarScore] = useState(results?.grammarScore || 0);
  const [adjustedCreativityScore, setAdjustedCreativityScore] = useState(results?.creativityScore || 0);
  
  // Approval dialog state
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  
  if (!results || !submissionInfo) return null;

  const getGradeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPercentage = (score: number, maxScore: number) => 
    Math.round((score / maxScore) * 100);

  const handleStartEditing = () => {
    setIsEditing(true);
    setAdjustedGrade(results.aiGrade);
    setAdjustedFeedback(results.feedback);
    setAdjustedStrengths(results.strengths || []);
    setAdjustedImprovements(results.improvements || []);
    setAdjustedContentScore(results.contentScore || 0);
    setAdjustedStructureScore(results.structureScore || 0);
    setAdjustedGrammarScore(results.grammarScore || 0);
    setAdjustedCreativityScore(results.creativityScore || 0);
  };

  const handlePreviewAdjustments = () => {
    setShowApprovalDialog(true);
  };

  const handleApproveAdjustments = async () => {
    setSavingFeedback(true);
    try {
      const submissionId = submissionInfo.submissionId;
      
      if (!submissionId) {
        throw new Error('Submission ID not found');
      }

      // Get or create submission grade record
      let { data: gradeData, error: fetchError } = await supabase
        .from('submission_grades')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const gradeUpdate = {
        ai_grade: adjustedGrade,
        teacher_grade: adjustedGrade,
        ai_feedback: adjustedFeedback,
        teacher_feedback: adjustedFeedback,
        strengths: adjustedStrengths,
        improvements: adjustedImprovements,
        content_score: adjustedContentScore,
        structure_score: adjustedStructureScore,
        grammar_score: adjustedGrammarScore,
        creativity_score: adjustedCreativityScore,
        overall_score: adjustedGrade,
        graded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (gradeData) {
        // Update existing grade
        const { error: updateError } = await supabase
          .from('submission_grades')
          .update(gradeUpdate)
          .eq('id', gradeData.id);

        if (updateError) throw updateError;
      } else {
        // Create new grade record
        const { error: insertError } = await supabase
          .from('submission_grades')
          .insert({
            submission_id: submissionId,
            ...gradeUpdate
          });

        if (insertError) throw insertError;
      }

      // Update submission status
      const { error: submissionError } = await supabase
        .from('submissions')
        .update({
          status: 'graded',
          grade: adjustedGrade,
          feedback: adjustedFeedback,
          teacher_comments: adjustedFeedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (submissionError) throw submissionError;

      // Trigger sentiment analysis for the student
      const { error: sentimentError } = await supabase.functions.invoke('analyze-feedback-sentiment', {
        body: {
          studentId: submissionInfo.studentId,
          feedbackText: adjustedFeedback
        }
      });

      if (sentimentError) {
        console.warn('Sentiment analysis failed:', sentimentError);
      }

      toast({
        title: "Grade Approved & Saved",
        description: "The adjusted grade and analysis have been saved successfully.",
      });

      setShowApprovalDialog(false);
      setIsEditing(false);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving adjusted grade:', error);
      toast({
        title: "Error",
        description: "Failed to save adjusted grade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!teacherFeedback.trim() || !submissionInfo) return;

    setSavingFeedback(true);
    try {
      const submissionId = submissionInfo.submissionId;
      
      if (!submissionId) {
        throw new Error('Submission ID not found');
      }

      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          feedback: teacherFeedback,
          teacher_comments: teacherFeedback,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      const { error: sentimentError } = await supabase.functions.invoke('analyze-feedback-sentiment', {
        body: {
          studentId: submissionInfo.studentId,
          feedbackText: teacherFeedback
        }
      });

      if (sentimentError) {
        console.warn('Sentiment analysis failed:', sentimentError);
      }

      toast({
        title: "Feedback Saved",
        description: "Your feedback has been saved and the student will be notified.",
      });

      setTeacherFeedback('');
    } catch (error: any) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingFeedback(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            AI Grading Results
          </DialogTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Student: {submissionInfo.studentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Assignment: {submissionInfo.assignmentTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Submitted: {new Date(submissionInfo.submittedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>File: {submissionInfo.fileName}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Edit/Adjust Toggle */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">AI Analysis Results</h3>
              {isEditing && <Badge variant="secondary">Editing Mode</Badge>}
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={handleStartEditing} variant="outline" size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Adjust Results
                </Button>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button onClick={handlePreviewAdjustments} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Preview & Approve
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Overall Grade */}
          <div className={`p-6 rounded-lg border ${getGradeColor(isEditing ? adjustedGrade : results.aiGrade, submissionInfo.maxPoints)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold text-lg">Overall Grade</span>
              </div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={submissionInfo.maxPoints}
                    value={adjustedGrade}
                    onChange={(e) => setAdjustedGrade(Number(e.target.value))}
                    className="w-20 text-center"
                  />
                  <span>/ {submissionInfo.maxPoints}</span>
                </div>
              ) : (
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {results.aiGrade}/{submissionInfo.maxPoints} ({getPercentage(results.aiGrade, submissionInfo.maxPoints)}%)
                </Badge>
              )}
            </div>
            <Progress 
              value={getPercentage(isEditing ? adjustedGrade : results.aiGrade, submissionInfo.maxPoints)} 
              className="mb-4"
            />
            {results.message && (
              <p className="text-sm font-medium">{results.message}</p>
            )}
            {results.note && (
              <Alert className="mt-3 border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  {results.note}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Component Scores */}
          {(results.contentScore || results.structureScore || results.grammarScore || results.creativityScore) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {results.contentScore && (
                <div className="p-4 border rounded-lg text-center">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min="0"
                        max="25"
                        value={adjustedContentScore}
                        onChange={(e) => setAdjustedContentScore(Number(e.target.value))}
                        className="text-center text-lg font-bold"
                      />
                      <div className="text-sm text-muted-foreground">Content Quality</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-blue-600">{results.contentScore}/25</div>
                      <div className="text-sm text-muted-foreground">Content Quality</div>
                    </>
                  )}
                </div>
              )}
              {results.structureScore && (
                <div className="p-4 border rounded-lg text-center">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min="0"
                        max="25"
                        value={adjustedStructureScore}
                        onChange={(e) => setAdjustedStructureScore(Number(e.target.value))}
                        className="text-center text-lg font-bold"
                      />
                      <div className="text-sm text-muted-foreground">Structure</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-600">{results.structureScore}/25</div>
                      <div className="text-sm text-muted-foreground">Structure</div>
                    </>
                  )}
                </div>
              )}
              {results.grammarScore && (
                <div className="p-4 border rounded-lg text-center">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min="0"
                        max="25"
                        value={adjustedGrammarScore}
                        onChange={(e) => setAdjustedGrammarScore(Number(e.target.value))}
                        className="text-center text-lg font-bold"
                      />
                      <div className="text-sm text-muted-foreground">Grammar</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-purple-600">{results.grammarScore}/25</div>
                      <div className="text-sm text-muted-foreground">Grammar</div>
                    </>
                  )}
                </div>
              )}
              {results.creativityScore && (
                <div className="p-4 border rounded-lg text-center">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min="0"
                        max="25"
                        value={adjustedCreativityScore}
                        onChange={(e) => setAdjustedCreativityScore(Number(e.target.value))}
                        className="text-center text-lg font-bold"
                      />
                      <div className="text-sm text-muted-foreground">Creativity</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-orange-600">{results.creativityScore}/25</div>
                      <div className="text-sm text-muted-foreground">Creativity</div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Detailed Feedback */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Detailed Feedback</h4>
            {isEditing ? (
              <Textarea
                value={adjustedFeedback}
                onChange={(e) => setAdjustedFeedback(e.target.value)}
                rows={6}
                className="resize-none"
                placeholder="Enter detailed feedback for the student..."
              />
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm leading-relaxed">{results.feedback}</p>
              </div>
            )}
          </div>

          {/* Strengths */}
          {((isEditing ? adjustedStrengths : results.strengths) && (isEditing ? adjustedStrengths : results.strengths).length > 0) && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Strengths ({(isEditing ? adjustedStrengths : results.strengths).length})
              </h4>
              {isEditing ? (
                <div className="space-y-2">
                  {adjustedStrengths.map((strength, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={strength}
                        onChange={(e) => {
                          const newStrengths = [...adjustedStrengths];
                          newStrengths[index] = e.target.value;
                          setAdjustedStrengths(newStrengths);
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => {
                          const newStrengths = adjustedStrengths.filter((_, i) => i !== index);
                          setAdjustedStrengths(newStrengths);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => setAdjustedStrengths([...adjustedStrengths, ''])}
                    variant="outline"
                    size="sm"
                  >
                    Add Strength
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-sm text-green-800">{strength}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Areas for Improvement */}
          {((isEditing ? adjustedImprovements : results.improvements) && (isEditing ? adjustedImprovements : results.improvements).length > 0) && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Areas for Improvement ({(isEditing ? adjustedImprovements : results.improvements).length})
              </h4>
              {isEditing ? (
                <div className="space-y-2">
                  {adjustedImprovements.map((improvement, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={improvement}
                        onChange={(e) => {
                          const newImprovements = [...adjustedImprovements];
                          newImprovements[index] = e.target.value;
                          setAdjustedImprovements(newImprovements);
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => {
                          const newImprovements = adjustedImprovements.filter((_, i) => i !== index);
                          setAdjustedImprovements(newImprovements);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => setAdjustedImprovements([...adjustedImprovements, ''])}
                    variant="outline"
                    size="sm"
                  >
                    Add Improvement
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.improvements.map((improvement, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-blue-600 mt-1">→</span>
                      <span className="text-sm text-blue-800">{improvement}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Teacher Feedback Section */}
          <div className="space-y-3">
            <Label htmlFor="teacher-feedback" className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Teacher Feedback for Student
            </Label>
            <Textarea
              id="teacher-feedback"
              placeholder="Write personalized feedback for the student. This will be analyzed for sentiment to help the student understand key improvement areas..."
              value={teacherFeedback}
              onChange={(e) => setTeacherFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                This feedback will be sentiment-analyzed to provide insights to the student
              </p>
              <Button
                onClick={handleSaveFeedback}
                disabled={!teacherFeedback.trim() || savingFeedback}
                size="sm"
              >
                {savingFeedback ? 'Saving...' : 'Save Feedback'}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {!isEditing && (
              <Button 
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                Grade Applied ✓
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Adjusted Grade & Analysis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-semibold mb-2">Final Grade Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Overall Grade:</span>
                  <span className="ml-2 font-medium">{adjustedGrade}/{submissionInfo.maxPoints}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Percentage:</span>
                  <span className="ml-2 font-medium">{getPercentage(adjustedGrade, submissionInfo.maxPoints)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Content:</span>
                  <span className="ml-2 font-medium">{adjustedContentScore}/25</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Structure:</span>
                  <span className="ml-2 font-medium">{adjustedStructureScore}/25</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Grammar:</span>
                  <span className="ml-2 font-medium">{adjustedGrammarScore}/25</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Creativity:</span>
                  <span className="ml-2 font-medium">{adjustedCreativityScore}/25</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Feedback</h4>
              <div className="p-3 bg-muted/50 rounded text-sm max-h-40 overflow-y-auto">
                {adjustedFeedback}
              </div>
            </div>

            {adjustedStrengths.filter(s => s.trim()).length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Strengths ({adjustedStrengths.filter(s => s.trim()).length})</h4>
                <ul className="text-sm space-y-1">
                  {adjustedStrengths.filter(s => s.trim()).map((strength, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {adjustedImprovements.filter(i => i.trim()).length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Areas for Improvement ({adjustedImprovements.filter(i => i.trim()).length})</h4>
                <ul className="text-sm space-y-1">
                  {adjustedImprovements.filter(i => i.trim()).map((improvement, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-blue-600" />
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Back to Edit
              </Button>
              <Button 
                onClick={handleApproveAdjustments}
                disabled={savingFeedback}
              >
                {savingFeedback ? 'Saving...' : 'Approve & Save Grade'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default GradingResultsDialog;