import AssignmentCalendar from '@/components/calendar/AssignmentCalendar';

const Calendar = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assignment Calendar</h1>
        <p className="text-muted-foreground">
          View your assignment deadlines and track your progress
        </p>
      </div>
      
      <AssignmentCalendar className="min-h-[600px]" />
    </div>
  );
};

export default Calendar;