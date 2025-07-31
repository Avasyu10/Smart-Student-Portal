import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, Eye, FileSearch } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface PlagiarismDetectorProps {
  submissionId: string;
  onAnalysisComplete?: (result: any) => void;
  className?: string;
}

const PlagiarismDetector: React.FC<PlagiarismDetectorProps> = ({
  submissionId,
  onAnalysisComplete,
  className
}) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runPlagiarismCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-plagiarism', {
        body: { submissionId }
      });

      if (error) throw error;

      if (data.plagiarismAnalysis) {
        setAnalysis(data.plagiarismAnalysis);
        onAnalysisComplete?.(data.plagiarismAnalysis);
        
        const riskLevel = data.plagiarismAnalysis.riskScore > 70 ? 'high' : 
                         data.plagiarismAnalysis.riskScore > 30 ? 'medium' : 'low';
        
        toast({
          title: "Plagiarism Check Complete",
          description: `Risk level: ${riskLevel}. Score: ${data.plagiarismAnalysis.riskScore}%`,
          variant: riskLevel === 'high' ? 'destructive' : 'default'
        });
      }
    } catch (error: any) {
      console.error('Error checking plagiarism:', error);
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to check plagiarism. Please ensure Gemini API key is configured.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return 'text-red-600 bg-red-50 border-red-200';
    if (score > 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskIcon = (score: number) => {
    if (score > 70) return <AlertTriangle className="h-4 w-4" />;
    if (score > 30) return <Eye className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getRiskLabel = (score: number) => {
    if (score > 70) return 'High Risk';
    if (score > 30) return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Plagiarism Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary/10 rounded-full">
              <FileSearch className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                AI-powered plagiarism detection analyzes your submission for potential academic integrity issues.
              </p>
              <Button 
                onClick={runPlagiarismCheck} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyzing...
                  </div>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Check for Plagiarism
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Risk Score */}
            <div className={`p-4 rounded-lg border ${getRiskColor(analysis.riskScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getRiskIcon(analysis.riskScore)}
                  <span className="font-medium">{getRiskLabel(analysis.riskScore)}</span>
                </div>
                <Badge variant="outline">
                  {analysis.riskScore}% Risk
                </Badge>
              </div>
              <Progress value={analysis.riskScore} className="mb-2" />
              <p className="text-sm">{analysis.overallAssessment}</p>
            </div>

            {/* Suspicious Sections */}
            {analysis.suspiciousSections && analysis.suspiciousSections.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Flagged Content
                </h4>
                <div className="space-y-2">
                  {analysis.suspiciousSections.map((section: any, index: number) => (
                    <Alert key={index} className="border-yellow-200 bg-yellow-50">
                      <AlertDescription>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">"{section.text}"</p>
                          <p className="text-xs text-muted-foreground">{section.reason}</p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recommendations</h4>
                <ul className="space-y-1 text-sm">
                  {analysis.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={runPlagiarismCheck} variant="outline" className="w-full">
              Re-run Check
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlagiarismDetector;