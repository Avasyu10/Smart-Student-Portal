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
import { Shield, AlertTriangle, CheckCircle, Eye } from 'lucide-react';

interface PlagiarismResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: {
    riskScore: number;
    suspiciousSections?: Array<{
      text: string;
      reason: string;
    }>;
    recommendations?: string[];
    overallAssessment: string;
  } | null;
  studentName?: string;
  assignmentTitle?: string;
}

const PlagiarismResultsDialog: React.FC<PlagiarismResultsDialogProps> = ({
  open,
  onOpenChange,
  results,
  studentName,
  assignmentTitle
}) => {
  if (!results) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Plagiarism Analysis Results
          </DialogTitle>
          {(studentName || assignmentTitle) && (
            <div className="text-sm text-muted-foreground">
              {studentName && <span>Student: {studentName}</span>}
              {studentName && assignmentTitle && <span> • </span>}
              {assignmentTitle && <span>Assignment: {assignmentTitle}</span>}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Risk Score */}
          <div className={`p-4 rounded-lg border ${getRiskColor(results.riskScore)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getRiskIcon(results.riskScore)}
                <span className="font-medium">{getRiskLabel(results.riskScore)}</span>
              </div>
              <Badge variant="outline">
                {results.riskScore}% Risk
              </Badge>
            </div>
            <Progress value={results.riskScore} className="mb-2" />
            <p className="text-sm">{results.overallAssessment}</p>
          </div>

          {/* Suspicious Sections */}
          {results.suspiciousSections && results.suspiciousSections.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Flagged Content ({results.suspiciousSections.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {results.suspiciousSections.map((section, index) => (
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
          {results.recommendations && results.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Recommendations</h4>
              <ul className="space-y-1 text-sm">
                {results.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlagiarismResultsDialog;