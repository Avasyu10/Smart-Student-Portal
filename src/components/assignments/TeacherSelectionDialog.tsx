import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Users } from 'lucide-react';

interface Teacher {
  user_id: string;
  full_name: string;
  email: string;
}

interface TeacherSelectionDialogProps {
  onTeachersUpdated: () => void;
}

export const TeacherSelectionDialog = ({ onTeachersUpdated }: TeacherSelectionDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTeachers();
      fetchSelectedTeachers();
    }
  }, [open]);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('role', 'teacher');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load teachers",
        variant: "destructive",
      });
    }
  };

  const fetchSelectedTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('student_teachers')
        .select('teacher_id')
        .eq('student_id', profile?.user_id);

      if (error) throw error;
      setSelectedTeachers(data?.map(st => st.teacher_id) || []);
    } catch (error) {
      console.error('Error fetching selected teachers:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Remove existing relationships
      await supabase
        .from('student_teachers')
        .delete()
        .eq('student_id', profile?.user_id);

      // Add new relationships
      if (selectedTeachers.length > 0) {
        const relationships = selectedTeachers.map(teacherId => ({
          student_id: profile?.user_id,
          teacher_id: teacherId,
        }));

        const { error } = await supabase
          .from('student_teachers')
          .insert(relationships);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Teacher selection updated successfully",
      });

      setOpen(false);
      onTeachersUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update teacher selection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Select Teachers
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Your Teachers</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {teachers.map((teacher) => (
            <div key={teacher.user_id} className="flex items-center space-x-2">
              <Checkbox
                id={teacher.user_id}
                checked={selectedTeachers.includes(teacher.user_id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTeachers([...selectedTeachers, teacher.user_id]);
                  } else {
                    setSelectedTeachers(selectedTeachers.filter(id => id !== teacher.user_id));
                  }
                }}
              />
              <label htmlFor={teacher.user_id} className="text-sm font-medium">
                {teacher.full_name} ({teacher.email})
              </label>
            </div>
          ))}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              Save Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};