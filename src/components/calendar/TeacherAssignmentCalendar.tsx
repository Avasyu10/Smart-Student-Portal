import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Plus, Edit, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, isSameDay, parseISO, differenceInDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { PersonalEventDialog } from './PersonalEventDialog';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  course_name: string;
  max_points: number;
  status: string;
  created_by: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  status: string;
  submitted_at: string;
  grade?: number;
}

interface PersonalEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string | null;
  event_type: 'personal' | 'work' | 'study' | 'meeting' | 'reminder' | 'other';
  color: string;
  all_day: boolean;
}

interface TeacherAssignmentCalendarProps {
  className?: string;
}

const TeacherAssignmentCalendar: React.FC<TeacherAssignmentCalendarProps> = ({ className }) => {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedAssignments, setSelectedAssignments] = useState<Assignment[]>([]);
  const [selectedPersonalEvents, setSelectedPersonalEvents] = useState<PersonalEvent[]>([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PersonalEvent | undefined>();
  const [loading, setLoading] = useState(true);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date()); // Track the month/week being viewed

  useEffect(() => {
    if (profile?.role === 'teacher') {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      // Fetch teacher's assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('created_by', profile?.user_id)
        .eq('status', 'active')
        .order('due_date', { ascending: true });

      // Fetch all submissions for teacher's assignments
      const assignmentIds = assignmentsData?.map(a => a.id) || [];
      let submissionsData: Submission[] = [];
      
      if (assignmentIds.length > 0) {
        const { data } = await supabase
          .from('submissions')
          .select('*')
          .in('assignment_id', assignmentIds);
        submissionsData = data || [];
      }

      // Fetch personal events
      const { data: personalEventsData } = await supabase
        .from('personal_events')
        .select('*')
        .eq('user_id', profile?.user_id)
        .order('event_date', { ascending: true });

      setAssignments(assignmentsData || []);
      setSubmissions(submissionsData);
      setPersonalEvents((personalEventsData as PersonalEvent[]) || []);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentForDate = (date: Date) => {
    return assignments.filter(assignment => {
      const dueDate = parseISO(assignment.due_date);
      return isSameDay(dueDate, date);
    });
  };

  const getPersonalEventsForDate = (date: Date) => {
    return personalEvents.filter(event => {
      const eventDate = new Date(event.event_date);
      return isSameDay(eventDate, date);
    });
  };

  const getSubmissionsForAssignment = (assignmentId: string) => {
    return submissions.filter(sub => sub.assignment_id === assignmentId);
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const assignmentSubmissions = getSubmissionsForAssignment(assignment.id);
    const dueDate = parseISO(assignment.due_date);
    const now = new Date();
    const daysUntilDue = differenceInDays(dueDate, now);

    const totalSubmissions = assignmentSubmissions.length;
    const gradedSubmissions = assignmentSubmissions.filter(s => s.grade !== null).length;

    if (daysUntilDue < 0) {
      return { 
        status: 'deadline_passed', 
        label: 'Deadline Passed', 
        color: 'bg-destructive',
        submissionInfo: `${totalSubmissions} submissions, ${gradedSubmissions} graded`
      };
    }
    
    if (daysUntilDue <= 2) {
      return { 
        status: 'due_soon', 
        label: 'Due Soon', 
        color: 'bg-secondary',
        submissionInfo: `${totalSubmissions} submissions, ${gradedSubmissions} graded`
      };
    }

    return { 
      status: 'upcoming', 
      label: 'Upcoming', 
      color: 'bg-blue-500',
      submissionInfo: `${totalSubmissions} submissions, ${gradedSubmissions} graded`
    };
  };

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;
    
    const dayAssignments = getAssignmentForDate(date);
    const dayPersonalEvents = getPersonalEventsForDate(date);
    
    setSelectedDate(date);
    setSelectedAssignments(dayAssignments);
    setSelectedPersonalEvents(dayPersonalEvents);
  };

  const handleAddEvent = (date?: Date) => {
    setSelectedDate(date || new Date());
    setEditingEvent(undefined);
    setShowEventDialog(true);
  };

  const handleEditEvent = (event: PersonalEvent) => {
    setEditingEvent(event);
    setShowEventDialog(true);
  };

  const modifiers = {
    hasAssignment: (date: Date) => {
      const dayAssignments = getAssignmentForDate(date);
      return dayAssignments.some(assignment => {
        const status = getAssignmentStatus(assignment);
        return status.status === 'upcoming';
      });
    },
    hasPersonalEvent: (date: Date) => getPersonalEventsForDate(date).length > 0,
    hasAnyEvent: (date: Date) => getAssignmentForDate(date).length > 0 || getPersonalEventsForDate(date).length > 0,
    deadlinePassed: (date: Date) => {
      const dayAssignments = getAssignmentForDate(date);
      return dayAssignments.some(assignment => {
        const status = getAssignmentStatus(assignment);
        return status.status === 'deadline_passed';
      });
    },
    dueSoon: (date: Date) => {
      const dayAssignments = getAssignmentForDate(date);
      return dayAssignments.some(assignment => {
        const status = getAssignmentStatus(assignment);
        return status.status === 'due_soon';
      });
    }
  };

  const modifiersStyles = {
    hasAnyEvent: {
      fontWeight: 'bold',
      position: 'relative' as const,
    },
    deadlinePassed: {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
      border: '2px solid hsl(var(--destructive))',
      borderRadius: '6px',
    },
    dueSoon: {
      backgroundColor: 'hsl(var(--secondary))',
      color: 'hsl(var(--secondary-foreground))',
      border: '2px solid hsl(var(--secondary))',
      borderRadius: '6px',
    },
    hasPersonalEvent: {
      backgroundColor: 'hsl(var(--accent))',
      color: 'hsl(var(--accent-foreground))',
    },
    hasAssignment: {
      backgroundColor: 'hsl(214 95% 56%)', // Blue color matching legend
      color: 'hsl(var(--primary-foreground))',
      border: '2px solid hsl(214 95% 56%)',
      borderRadius: '6px',
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

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Assignment & Personal Calendar
          </CardTitle>
          <Button onClick={() => handleAddEvent()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Upcoming Assignments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span>Due Soon</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                <span>Deadline Passed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent"></div>
                <span>Personal Events</span>
              </div>
            </div>

            {/* Calendar Layout */}
            <div className="flex gap-8">
              {/* Calendar - Auto-sized to content */}
              <div className="flex-shrink-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDayClick}
                  onMonthChange={setCurrentViewDate}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  className="rounded-md border [&_.rdp]:m-0 [&_.rdp-months]:flex [&_.rdp-month]:m-0 [&_.rdp-table]:w-full [&_.rdp-head_row]:grid [&_.rdp-head_row]:grid-cols-7 [&_.rdp-head_cell]:p-3 [&_.rdp-head_cell]:text-sm [&_.rdp-head_cell]:font-medium [&_.rdp-tbody]:space-y-1 [&_.rdp-row]:grid [&_.rdp-row]:grid-cols-7 [&_.rdp-row]:gap-1 [&_.rdp-cell]:p-1 [&_.rdp-day]:h-16 [&_.rdp-day]:w-16 [&_.rdp-day]:flex [&_.rdp-day]:items-center [&_.rdp-day]:justify-center [&_.rdp-day]:text-sm [&_.rdp-day]:rounded-md [&_.rdp-nav]:flex [&_.rdp-nav]:items-center [&_.rdp-nav]:justify-between [&_.rdp-nav]:p-4 [&_.rdp-caption_label]:text-lg [&_.rdp-caption_label]:font-semibold [&_.rdp-button_previous]:h-8 [&_.rdp-button_previous]:w-8 [&_.rdp-button_next]:h-8 [&_.rdp-button_next]:w-8"
                />
              </div>

              {/* Dynamic Right Sidebar */}
              <div className="flex-1 min-w-0 space-y-4">
                {selectedDate ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        {format(selectedDate, 'MMM d, yyyy')}
                      </h4>
                      <Button size="sm" onClick={() => handleAddEvent(selectedDate)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Assignments for selected date */}
                    {selectedAssignments.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-muted-foreground">ASSIGNMENT DEADLINES</h5>
                        {selectedAssignments.map(assignment => {
                          const status = getAssignmentStatus(assignment);
                          const dueDate = parseISO(assignment.due_date);
                          const assignmentSubmissions = getSubmissionsForAssignment(assignment.id);
                          
                          return (
                            <div key={assignment.id} className="p-3 border rounded-lg space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h6 className="font-medium text-sm">{assignment.title}</h6>
                                  <p className="text-xs text-muted-foreground">{assignment.course_name}</p>
                                </div>
                                <Badge variant={status.status === 'deadline_passed' ? 'destructive' : 'outline'} className="text-xs">
                                  {status.label}
                                </Badge>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                Due: {format(dueDate, 'h:mm a')}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs">
                                <Users className="h-3 w-3" />
                                <span>{status.submissionInfo}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Personal events for selected date */}
                    {selectedPersonalEvents.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-muted-foreground">PERSONAL EVENTS</h5>
                        {selectedPersonalEvents.map(event => (
                          <div key={event.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full mt-0.5" 
                                  style={{ backgroundColor: event.color }}
                                ></div>
                                <div>
                                  <h6 className="font-medium text-sm">{event.title}</h6>
                                  <p className="text-xs text-muted-foreground capitalize">{event.event_type}</p>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost" onClick={() => handleEditEvent(event)} className="h-6 w-6 p-0">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {event.description && (
                              <p className="text-xs">{event.description}</p>
                            )}
                            
                            <div className="text-xs text-muted-foreground">
                              {event.all_day ? 'All day' : `Time: ${event.event_time}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show add event option if no events */}
                    {selectedAssignments.length === 0 && selectedPersonalEvents.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-3">No events for this day</p>
                        <Button size="sm" onClick={() => handleAddEvent(selectedDate)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Event
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Default sidebar content when no date selected */
                  <div className="space-y-4">
                    <h4 className="font-medium">Week of {format(currentViewDate, 'MMM d, yyyy')}</h4>
                    
                    {/* Current Viewing Week's Assignment Deadlines */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-muted-foreground">THIS WEEK</h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {assignments
                          .filter(assignment => {
                            const dueDate = parseISO(assignment.due_date);
                            const weekStart = startOfWeek(currentViewDate, { weekStartsOn: 0 }); // Sunday
                            const weekEnd = endOfWeek(currentViewDate, { weekStartsOn: 0 }); // Saturday
                            return isWithinInterval(dueDate, { start: weekStart, end: weekEnd });
                          })
                          .slice(0, 4)
                          .map(assignment => {
                            const status = getAssignmentStatus(assignment);
                            const dueDate = parseISO(assignment.due_date);
                            const now = new Date();
                            const daysUntilDue = differenceInDays(dueDate, now);
                            
                            let timeLabel = '';
                            if (daysUntilDue < 0) {
                              timeLabel = `${Math.abs(daysUntilDue)} days ago`;
                            } else if (daysUntilDue === 0) {
                              timeLabel = 'Due Today';
                            } else if (daysUntilDue === 1) {
                              timeLabel = 'Due Tomorrow';
                            } else {
                              timeLabel = `Due in ${daysUntilDue} days`;
                            }
                            
                            return (
                              <div key={assignment.id} className="flex items-center justify-between p-3 rounded border hover:bg-accent/50 cursor-pointer text-sm border-l-4"
                                   style={{ borderLeftColor: status.status === 'upcoming' ? 'hsl(214 95% 56%)' : status.status === 'due_soon' ? 'hsl(var(--secondary))' : 'hsl(var(--destructive))' }}
                                   onClick={() => handleDayClick(dueDate)}>
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                                  <div>
                                    <p className="font-medium text-sm">{assignment.title}</p>
                                    <p className="text-xs text-muted-foreground">{assignment.course_name}</p>
                                    <p className="text-xs font-medium text-blue-600">{timeLabel}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-muted-foreground block">
                                    {format(dueDate, 'MMM d')}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(dueDate, 'h:mm a')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        {assignments.filter(assignment => {
                          const dueDate = parseISO(assignment.due_date);
                          const weekStart = startOfWeek(currentViewDate, { weekStartsOn: 0 });
                          const weekEnd = endOfWeek(currentViewDate, { weekStartsOn: 0 });
                          return isWithinInterval(dueDate, { start: weekStart, end: weekEnd });
                        }).length === 0 && (
                          <p className="text-sm text-muted-foreground italic">No assignments due this week</p>
                        )}
                      </div>
                    </div>

                    {/* Next Week's Assignment Deadlines */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-muted-foreground">NEXT WEEK</h5>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {assignments
                          .filter(assignment => {
                            const dueDate = parseISO(assignment.due_date);
                            const nextWeekStart = startOfWeek(new Date(currentViewDate.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 });
                            const nextWeekEnd = endOfWeek(new Date(currentViewDate.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 });
                            return isWithinInterval(dueDate, { start: nextWeekStart, end: nextWeekEnd });
                          })
                          .slice(0, 3)
                          .map(assignment => {
                            const status = getAssignmentStatus(assignment);
                            const dueDate = parseISO(assignment.due_date);
                            
                            return (
                              <div key={assignment.id} className="flex items-center justify-between p-2 rounded border hover:bg-accent/50 cursor-pointer text-sm opacity-75"
                                   onClick={() => handleDayClick(dueDate)}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                                  <div>
                                    <p className="font-medium text-xs">{assignment.title}</p>
                                    <p className="text-xs text-muted-foreground">{assignment.course_name}</p>
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(dueDate, 'MMM d')}
                                </span>
                              </div>
                            );
                          })}
                        {assignments.filter(assignment => {
                          const dueDate = parseISO(assignment.due_date);
                          const nextWeekStart = startOfWeek(new Date(currentViewDate.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 });
                          const nextWeekEnd = endOfWeek(new Date(currentViewDate.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 });
                          return isWithinInterval(dueDate, { start: nextWeekStart, end: nextWeekEnd });
                        }).length === 0 && (
                          <p className="text-sm text-muted-foreground italic">No assignments due next week</p>
                        )}
                      </div>
                    </div>

                    {/* Upcoming Personal Events */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-muted-foreground">PERSONAL EVENTS</h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {personalEvents
                          .filter(event => {
                            const eventDate = new Date(event.event_date);
                            const daysUntilEvent = differenceInDays(eventDate, new Date());
                            return daysUntilEvent >= 0 && daysUntilEvent <= 7;
                          })
                          .slice(0, 4)
                          .map(event => {
                            const eventDate = new Date(event.event_date);
                            
                            return (
                              <div key={event.id} className="flex items-center justify-between p-2 rounded border hover:bg-accent/50 cursor-pointer text-sm"
                                   onClick={() => handleDayClick(eventDate)}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: event.color }}
                                  ></div>
                                  <div>
                                    <p className="font-medium text-xs">{event.title}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{event.event_type}</p>
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(eventDate, 'MMM d')}
                                </span>
                              </div>
                            );
                          })}
                        {personalEvents.filter(event => {
                          const eventDate = new Date(event.event_date);
                          const daysUntilEvent = differenceInDays(eventDate, new Date());
                          return daysUntilEvent >= 0 && daysUntilEvent <= 7;
                        }).length === 0 && (
                          <p className="text-sm text-muted-foreground">No upcoming personal events</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Event Dialog */}
      <PersonalEventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        selectedDate={selectedDate}
        event={editingEvent}
        onEventCreated={fetchData}
      />
    </>
  );
};

export default TeacherAssignmentCalendar;