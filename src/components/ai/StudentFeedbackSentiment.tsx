import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  Target,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidenceScore: number;
  keyThemes: string[];
  focusAreas: string[];
  encouragements: string[];
  personalizedMessage: string;
  emotionalTone: 'constructive' | 'critical' | 'supportive' | 'neutral';
  improvementPriority: 'high' | 'medium' | 'low';
}

interface FeedbackWithSentiment {
  feedback: string;
  assignment_title: string;
  course_name: string;
  grade: number;
  max_points: number;
  submitted_at: string;
  sentimentAnalysis?: SentimentAnalysis;
}

const StudentFeedbackSentiment = () => {
  const { profile } = useAuth();
  const [feedbackData, setFeedbackData] = useState<FeedbackWithSentiment[]>([]);
  const [overallSentiment, setOverallSentiment] = useState<SentimentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'student') {
      fetchFeedbackData();
    }
  }, [profile]);

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);

      // Get student's submissions with feedback
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select(`
          feedback,
          grade,
          submitted_at,
          assignment:assignments(title, course_name, max_points)
        `)
        .eq('student_id', profile?.user_id)
        .not('feedback', 'is', null)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      if (submissions && submissions.length > 0) {
        // Get the latest sentiment analysis for this student
        const { data: sentimentData } = await supabase
          .from('student_feedback_analysis')
          .select('sentiment_analysis')
          .eq('student_id', profile?.user_id)
          .order('analyzed_at', { ascending: false })
          .limit(1);

        const latestSentiment = sentimentData?.[0]?.sentiment_analysis;

        // Format the feedback data
        const formattedFeedback = submissions.map(sub => ({
          feedback: sub.feedback,
          assignment_title: sub.assignment?.title || 'Unknown Assignment',
          course_name: sub.assignment?.course_name || 'Unknown Course',
          grade: sub.grade || 0,
          max_points: sub.assignment?.max_points || 100,
          submitted_at: sub.submitted_at,
          sentimentAnalysis: latestSentiment as unknown as SentimentAnalysis
        }));

        setFeedbackData(formattedFeedback);
        setOverallSentiment(latestSentiment as unknown as SentimentAnalysis);
      }
    } catch (error) {
      console.error('Error fetching feedback data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Heart className="h-4 w-4" />;
      case 'negative': return <AlertTriangle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getToneIcon = (tone: string) => {
    switch (tone) {
      case 'supportive': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'constructive': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing your feedback...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!overallSentiment || feedbackData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Feedback Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Feedback Analysis Yet</h3>
            <p className="text-muted-foreground">
              Complete assignments and receive teacher feedback to see personalized insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Feedback Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personalized Message */}
          <div className={`p-4 rounded-lg border ${getSentimentColor(overallSentiment.sentiment)}`}>
            <div className="flex items-center gap-2 mb-3">
              {getSentimentIcon(overallSentiment.sentiment)}
              <span className="font-medium capitalize">{overallSentiment.sentiment} Feedback</span>
              <Badge variant="outline" className="ml-auto">
                {overallSentiment.confidenceScore}% confidence
              </Badge>
            </div>
            <p className="text-sm font-medium mb-2">{overallSentiment.personalizedMessage}</p>
            <Progress value={overallSentiment.confidenceScore} className="h-2" />
          </div>

          {/* Feedback Tone & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              {getToneIcon(overallSentiment.emotionalTone)}
              <div>
                <p className="text-sm font-medium capitalize">{overallSentiment.emotionalTone} Tone</p>
                <p className="text-xs text-muted-foreground">Teacher's approach</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Target className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  Priority: 
                  <Badge variant={getPriorityColor(overallSentiment.improvementPriority)}>
                    {overallSentiment.improvementPriority}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">Improvement urgency</p>
              </div>
            </div>
          </div>

          {/* Key Themes */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              Key Themes in Your Feedback
            </h4>
            <div className="flex flex-wrap gap-2">
              {overallSentiment.keyThemes.map((theme, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>

          {/* Focus Areas vs Encouragements */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                Areas to Focus On
              </h4>
              <ul className="space-y-2">
                {overallSentiment.focusAreas.map((area, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-600 mt-1">→</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                What You're Doing Well
              </h4>
              <ul className="space-y-2">
                {overallSentiment.encouragements.map((encouragement, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>{encouragement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recent Feedback */}
          <div className="space-y-3">
            <h4 className="font-medium">Recent Teacher Feedback</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {feedbackData.slice(0, 3).map((feedback, index) => (
                <div key={index} className="p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{feedback.assignment_title}</p>
                    <Badge variant="outline" className="text-xs">
                      {feedback.grade}/{feedback.max_points}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{feedback.feedback}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(feedback.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={fetchFeedbackData}
            variant="outline" 
            className="w-full"
          >
            <Brain className="h-4 w-4 mr-2" />
            Refresh Analysis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFeedbackSentiment;