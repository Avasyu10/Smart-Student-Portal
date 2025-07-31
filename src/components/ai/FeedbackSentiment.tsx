import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Shield, Heart, MessageSquare, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface FeedbackSentimentProps {
  className?: string;
}

const FeedbackSentiment: React.FC<FeedbackSentimentProps> = ({ className }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.role === 'student') {
      fetchExistingAnalysis();
    }
  }, [profile]);

  const fetchExistingAnalysis = async () => {
    if (!profile?.user_id) return;

    try {
      // Only check if we have a recent analysis, don't generate new one
      const { data: existingAnalysis } = await supabase
        .from('student_feedback_analysis')
        .select('*')
        .eq('student_id', profile.user_id)
        .single();

      if (existingAnalysis && 
          new Date(existingAnalysis.analyzed_at).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
        // Use existing analysis if less than 24 hours old
        setAnalysis(existingAnalysis.sentiment_analysis);
      }
    } catch (error) {
      console.error('Error fetching existing analysis:', error);
    }
  };

  const generateNewAnalysis = async () => {
    if (!profile?.user_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-feedback-sentiment', {
        body: { studentId: profile?.user_id }
      });

      if (error) throw error;

      if (data.analysis) {
        setAnalysis(data.analysis);
        toast({
          title: "Feedback Analysis Updated",
          description: "Your personalized feedback summary has been refreshed!",
        });
      }
    } catch (error: any) {
      console.error('Error generating analysis:', error);
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze feedback. Please ensure Gemini API key is configured.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Heart className="h-4 w-4" />;
      case 'negative': return <AlertTriangle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Feedback Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">No feedback analysis available yet.</p>
            <Button onClick={generateNewAnalysis} disabled={loading}>
              Generate Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Your Feedback Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Sentiment */}
        <div className={`p-4 rounded-lg border ${getSentimentColor(analysis.overallSentiment)}`}>
          <div className="flex items-center gap-2 mb-2">
            {getSentimentIcon(analysis.overallSentiment)}
            <span className="font-medium capitalize">{analysis.overallSentiment} Sentiment</span>
          </div>
          <Progress value={analysis.sentimentScore} className="mb-2" />
          <p className="text-sm">Score: {analysis.sentimentScore}/100</p>
        </div>

        {/* Personalized Summary */}
        <div className="space-y-3">
          <h4 className="font-medium">Personal Summary</h4>
          <p className="text-sm leading-relaxed">{analysis.personalizedSummary}</p>
        </div>

        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Your Strengths
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.strengths.map((strength: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-green-50 text-green-700">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Areas */}
        {analysis.improvementAreas && analysis.improvementAreas.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Areas to Focus On
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.improvementAreas.map((area: string, index: number) => (
                <Badge key={index} variant="outline" className="border-blue-200 text-blue-700">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Recommendations */}
        {analysis.actionableRecommendations && analysis.actionableRecommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Next Steps</h4>
            <ul className="space-y-1 text-sm">
              {analysis.actionableRecommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Motivational Note */}
        {analysis.motivationalNote && (
          <Alert>
            <Heart className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {analysis.motivationalNote}
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={generateNewAnalysis} variant="outline" className="w-full">
          Refresh Analysis
        </Button>
      </CardContent>
    </Card>
  );
};

export default FeedbackSentiment;