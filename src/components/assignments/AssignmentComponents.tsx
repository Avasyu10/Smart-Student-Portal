import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RubricCreator } from '@/components/rubrics/RubricCreator';
import { Plus, Calendar, FileText, Clock, Users, Trash2 } from 'lucide-react';

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
  created_at: string;
}

export function CreateAssignmentDialog() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRubricId, setSelectedRubricId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!profile?.user_id || isLoading) return;

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const assignmentData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      course_name: formData.get('course_name') as string,
      due_date: formData.get('due_date') as string,
      max_points: parseInt(formData.get('max_points') as string) || 100,
      instructions: formData.get('instructions') as string,
      created_by: profile.user_id,
      file_types_allowed: ['pdf', 'doc', 'docx', 'txt'],
      max_file_size_mb: 10,
      status: 'active',
      rubric_id: selectedRubricId || null
    };

    try {
      const { error } = await supabase
        .from('assignments')
        .insert([assignmentData]);

      if (error) throw error;

      toast({
        title: "Assignment Created",
        description: "Your assignment has been successfully created.",
      });

      setIsOpen(false);
      window.location.reload(); // Simple refresh for now
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
          <DialogDescription>
            Set up a new assignment for your students
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Essay on Climate Change"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course_name">Course Name *</Label>
              <Input
                id="course_name"
                name="course_name"
                placeholder="e.g., Environmental Science"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of the assignment"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              name="instructions"
              placeholder="Detailed instructions for students"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                name="due_date"
                type="datetime-local"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_points">Maximum Points</Label>
              <Input
                id="max_points"
                name="max_points"
                type="number"
                placeholder="100"
                min="1"
                max="1000"
              />
            </div>
          </div>

          {/* Rubric Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">Grading Rubric</Label>
              <Badge variant="secondary">Optional</Badge>
            </div>
            <RubricCreator 
              selectedRubricId={selectedRubricId}
              onRubricSelected={setSelectedRubricId}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AssignmentCard({ assignment, onDelete }: { assignment: Assignment; onDelete?: () => void }) {
  const { toast } = useToast();
  const dueDate = new Date(assignment.due_date);
  const isOverdue = dueDate < new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  const deleteAssignment = async () => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignment.id);

      if (error) throw error;

      toast({
        title: "Assignment Deleted",
        description: "Assignment has been successfully deleted.",
      });

      if (onDelete) onDelete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            <CardDescription className="mt-1">
              {assignment.course_name}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={isOverdue ? "destructive" : daysUntilDue <= 2 ? "secondary" : "default"}>
              {assignment.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={deleteAssignment}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {assignment.max_points && (
              <span className="text-sm text-muted-foreground">
                {assignment.max_points} pts
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {assignment.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {assignment.description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Due: {dueDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {isOverdue && (
          <div className="mt-3 p-2 bg-destructive/10 text-destructive text-sm rounded">
            This assignment is overdue
          </div>
        )}
        
        {!isOverdue && daysUntilDue <= 2 && (
          <div className="mt-3 p-2 bg-secondary text-secondary-foreground text-sm rounded">
            Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}