import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, X, Trash2 } from 'lucide-react';

interface RubricCriteria {
  name: string;
  description: string;
  max_points: number;
  order_index: number;
}

interface RubricCreatorProps {
  onRubricCreated?: (rubricId: string) => void;
  selectedRubricId?: string;
  onRubricSelected?: (rubricId: string) => void;
}

const subjectTemplates: Record<string, RubricCriteria[]> = {
  essay: [
    { name: 'Argument Quality', description: 'Clear thesis and logical reasoning', max_points: 30, order_index: 0 },
    { name: 'Evidence & Support', description: 'Use of relevant examples and citations', max_points: 25, order_index: 1 },
    { name: 'Organization', description: 'Structure and flow of ideas', max_points: 20, order_index: 2 },
    { name: 'Grammar & Style', description: 'Language usage and writing mechanics', max_points: 25, order_index: 3 },
  ],
  programming: [
    { name: 'Correctness', description: 'Code produces expected output', max_points: 40, order_index: 0 },
    { name: 'Code Logic', description: 'Algorithm efficiency and approach', max_points: 30, order_index: 1 },
    { name: 'Code Style', description: 'Readability, comments, and conventions', max_points: 20, order_index: 2 },
    { name: 'Testing', description: 'Edge cases and error handling', max_points: 10, order_index: 3 },
  ],
  math: [
    { name: 'Problem Solving', description: 'Correct method and approach', max_points: 40, order_index: 0 },
    { name: 'Mathematical Reasoning', description: 'Logical steps and explanations', max_points: 30, order_index: 1 },
    { name: 'Accuracy', description: 'Correct calculations and final answer', max_points: 20, order_index: 2 },
    { name: 'Presentation', description: 'Clear notation and organization', max_points: 10, order_index: 3 },
  ],
  science: [
    { name: 'Scientific Understanding', description: 'Demonstrates knowledge of concepts', max_points: 35, order_index: 0 },
    { name: 'Data Analysis', description: 'Interpretation of results and evidence', max_points: 25, order_index: 1 },
    { name: 'Methodology', description: 'Experimental design and approach', max_points: 25, order_index: 2 },
    { name: 'Communication', description: 'Clear reporting and conclusions', max_points: 15, order_index: 3 },
  ],
};

export function RubricCreator({ onRubricCreated, selectedRubricId, onRubricSelected }: RubricCreatorProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [rubricName, setRubricName] = useState('');
  const [rubricDescription, setRubricDescription] = useState('');
  const [criteria, setCriteria] = useState<RubricCriteria[]>([]);
  const [existingRubrics, setExistingRubrics] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const loadExistingRubrics = async () => {
    if (!profile?.user_id) return;

    const { data, error } = await supabase
      .from('rubrics')
      .select('*')
      .eq('created_by', profile.user_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExistingRubrics(data);
    }
  };

  const useTemplate = (templateKey: string) => {
    setCriteria(subjectTemplates[templateKey] || []);
    setSelectedTemplate(templateKey);
  };

  const addCriteria = () => {
    setCriteria([...criteria, { 
      name: '', 
      description: '', 
      max_points: 10, 
      order_index: criteria.length 
    }]);
  };

  const updateCriteria = (index: number, field: keyof RubricCriteria, value: string | number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const removeCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const createRubric = async () => {
    if (!profile?.user_id || !rubricName.trim() || criteria.length === 0) {
      toast({
        title: "Error",
        description: "Please provide a name and at least one criteria",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const totalPoints = criteria.reduce((sum, c) => sum + c.max_points, 0);
      
      const { data: rubric, error: rubricError } = await supabase
        .from('rubrics')
        .insert({
          name: rubricName,
          description: rubricDescription,
          total_points: totalPoints,
          created_by: profile.user_id,
        })
        .select()
        .single();

      if (rubricError) throw rubricError;

      const criteriaData = criteria.map(c => ({
        rubric_id: rubric.id,
        name: c.name,
        description: c.description,
        max_points: c.max_points,
        order_index: c.order_index,
      }));

      const { error: criteriaError } = await supabase
        .from('rubric_criteria')
        .insert(criteriaData);

      if (criteriaError) throw criteriaError;

      toast({
        title: "Rubric Created",
        description: "Your rubric has been successfully created.",
      });

      // Reset form
      setRubricName('');
      setRubricDescription('');
      setCriteria([]);
      setSelectedTemplate('');
      
      if (onRubricCreated) {
        onRubricCreated(rubric.id);
      }
      
      loadExistingRubrics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create rubric",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Rubrics Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Existing Rubric</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={loadExistingRubrics}
              className="mb-4"
            >
              Load My Rubrics
            </Button>
          </div>
          {existingRubrics.length > 0 && (
            <Select value={selectedRubricId} onValueChange={onRubricSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an existing rubric" />
              </SelectTrigger>
              <SelectContent>
                {existingRubrics.map((rubric) => (
                  <SelectItem key={rubric.id} value={rubric.id}>
                    {rubric.name} ({rubric.total_points} pts)
                  </SelectItem>
                ))}</SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Create New Rubric */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Rubric</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Quick Templates</Label>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(subjectTemplates).map((template) => (
                <Button
                  key={template}
                  type="button"
                  variant={selectedTemplate === template ? "default" : "outline"}
                  size="sm"
                  onClick={() => useTemplate(template)}
                >
                  {template.charAt(0).toUpperCase() + template.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Rubric Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rubric-name">Rubric Name *</Label>
              <Input
                id="rubric-name"
                value={rubricName}
                onChange={(e) => setRubricName(e.target.value)}
                placeholder="e.g., Essay Grading Rubric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rubric-description">Description</Label>
              <Input
                id="rubric-description"
                value={rubricDescription}
                onChange={(e) => setRubricDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
          </div>

          {/* Criteria */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Grading Criteria</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCriteria}>
                <Plus className="h-4 w-4 mr-1" />
                Add Criteria
              </Button>
            </div>

            {criteria.map((criterion, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-4">
                    <Label>Criteria Name</Label>
                    <Input
                      value={criterion.name}
                      onChange={(e) => updateCriteria(index, 'name', e.target.value)}
                      placeholder="e.g., Grammar"
                    />
                  </div>
                  <div className="col-span-5">
                    <Label>Description</Label>
                    <Input
                      value={criterion.description}
                      onChange={(e) => updateCriteria(index, 'description', e.target.value)}
                      placeholder="What to evaluate"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      value={criterion.max_points}
                      onChange={(e) => updateCriteria(index, 'max_points', parseInt(e.target.value) || 0)}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCriteria(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {criteria.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Total Points: {criteria.reduce((sum, c) => sum + c.max_points, 0)}
            </div>
          )}

          <Button 
            type="button"
            onClick={createRubric} 
            disabled={isCreating || !rubricName.trim() || criteria.length === 0}
            className="w-full"
          >
            {isCreating ? "Creating..." : "Create Rubric"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
