import { useState, useEffect } from 'react';
import { RubricCreator } from '@/components/rubrics/RubricCreator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, FileText } from 'lucide-react';

interface Rubric {
  id: string;
  name: string;
  description: string;
  total_points: number;
  created_at: string;
  criteria: RubricCriteria[];
}

interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  max_points: number;
  order_index: number;
}

const Rubrics = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'teacher') {
      fetchRubrics();
    }
  }, [profile]);

  const fetchRubrics = async () => {
    try {
      const { data, error } = await supabase
        .from('rubrics')
        .select(`
          *,
          rubric_criteria (
            id,
            name,
            description,
            max_points,
            order_index
          )
        `)
        .eq('created_by', profile?.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const rubricsWithCriteria = data?.map(rubric => ({
        ...rubric,
        criteria: rubric.rubric_criteria?.sort((a, b) => a.order_index - b.order_index) || []
      })) || [];
      
      setRubrics(rubricsWithCriteria);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load rubrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRubric = async (rubricId: string) => {
    if (!confirm('Are you sure you want to delete this rubric?')) return;

    try {
      const { error } = await supabase
        .from('rubrics')
        .delete()
        .eq('id', rubricId);

      if (error) throw error;

      toast({
        title: "Rubric Deleted",
        description: "The rubric has been successfully deleted.",
      });

      fetchRubrics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete rubric",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading rubrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grading Rubrics</h1>
          <p className="text-muted-foreground">
            Create and manage rubrics for consistent grading
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Rubric Section */}
        <div>
          <RubricCreator onRubricCreated={fetchRubrics} />
        </div>

        {/* Existing Rubrics */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">My Rubrics</h2>
          
          {rubrics.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No rubrics yet</h3>
                <p className="text-muted-foreground">
                  Create your first rubric to standardize grading
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rubrics.map((rubric) => (
                <Card key={rubric.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{rubric.name}</CardTitle>
                        {rubric.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {rubric.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{rubric.total_points} pts</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRubric(rubric.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Criteria:</h4>
                      <div className="grid gap-2">
                        {rubric.criteria.map((criterion) => (
                          <div 
                            key={criterion.id}
                            className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded"
                          >
                            <div>
                              <span className="font-medium">{criterion.name}</span>
                              {criterion.description && (
                                <span className="text-muted-foreground ml-2">
                                  - {criterion.description}
                                </span>
                              )}
                            </div>
                            <Badge variant="outline">{criterion.max_points} pts</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rubrics;
