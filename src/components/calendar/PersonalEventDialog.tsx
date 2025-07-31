import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface PersonalEvent {
  id?: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  event_type: 'personal' | 'work' | 'study' | 'meeting' | 'reminder' | 'other';
  color: string;
  all_day: boolean;
}

interface PersonalEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  event?: PersonalEvent;
  onEventCreated: () => void;
}

const eventColors = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#ef4444', label: 'Red' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Yellow' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
  { value: '#84cc16', label: 'Lime' },
];

export function PersonalEventDialog({ 
  open, 
  onOpenChange, 
  selectedDate, 
  event, 
  onEventCreated 
}: PersonalEventDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PersonalEvent>({
    title: event?.title || '',
    description: event?.description || '',
    event_date: event?.event_date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
    event_time: event?.event_time || '09:00',
    event_type: event?.event_type || 'personal',
    color: event?.color || '#3b82f6',
    all_day: event?.all_day || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id) return;

    setLoading(true);
    try {
      const eventData = {
        user_id: profile.user_id,
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        event_time: formData.all_day ? null : formData.event_time,
        event_type: formData.event_type,
        color: formData.color,
        all_day: formData.all_day,
      };

      if (event?.id) {
        // Update existing event
        const { error } = await supabase
          .from('personal_events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;

        toast({
          title: "Event Updated",
          description: "Your personal event has been updated successfully!",
        });
      } else {
        // Create new event
        const { error } = await supabase
          .from('personal_events')
          .insert([eventData]);

        if (error) throw error;

        toast({
          title: "Event Created",
          description: "Your personal event has been created successfully!",
        });
      }

      onEventCreated();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        event_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        event_time: '09:00',
        event_type: 'personal',
        color: '#3b82f6',
        all_day: false,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('personal_events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Event Deleted",
        description: "Your personal event has been deleted successfully!",
      });

      onEventCreated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Personal Event' : 'Create Personal Event'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter event description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Date</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_time">Time</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                disabled={formData.all_day}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="all_day"
              checked={formData.all_day}
              onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
            />
            <Label htmlFor="all_day">All Day Event</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_type">Event Type</Label>
            <Select 
              value={formData.event_type} 
              onValueChange={(value: any) => setFormData({ ...formData, event_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="study">Study</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Event Color</Label>
            <div className="flex gap-2 flex-wrap">
              {eventColors.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === colorOption.value ? 'border-primary' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  onClick={() => setFormData({ ...formData, color: colorOption.value })}
                  title={colorOption.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            {event && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1"
              >
                Delete Event
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex-1"
            >
              {loading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}