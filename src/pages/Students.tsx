import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  BookOpen,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Student {
  id: string;
  full_name: string;
  email: string;
  assignmentStats: {
    total: number;
    submitted: number;
    graded: number;
    overdue: number;
    averageGrade: number;
  };
  recentSubmissions: any[];
}

const Students = () => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'behind' | 'excellent'>('all');

  useEffect(() => {
    if (profile?.role === 'teacher') {
      fetchStudents();
    }
  }, [profile]);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Get all students (users with student role)
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      // Get all assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, due_date, max_points');

      if (assignmentsError) throw assignmentsError;

      // Get all submissions with grades
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          assignment:assignments(title, course_name, due_date, max_points)
        `);

      if (submissionsError) throw submissionsError;

      // Calculate stats for each student
      const studentsWithStats = studentsData.map((student) => {
        const studentSubmissions = submissions?.filter(sub => sub.student_id === student.user_id) || [];
        const totalAssignments = assignments?.length || 0;
        
        const submittedCount = studentSubmissions.length;
        const gradedCount = studentSubmissions.filter(sub => sub.grade !== null).length;
        
        // Count overdue assignments
        const now = new Date();
        const overdueCount = assignments?.filter(assignment => {
          const dueDate = new Date(assignment.due_date);
          const hasSubmission = studentSubmissions.some(sub => sub.assignment_id === assignment.id);
          return dueDate < now && !hasSubmission;
        }).length || 0;

        // Calculate average grade
        const gradedSubmissions = studentSubmissions.filter(sub => sub.grade !== null);
        const averageGrade = gradedSubmissions.length > 0 
          ? gradedSubmissions.reduce((acc, sub) => acc + (sub.grade || 0), 0) / gradedSubmissions.length
          : 0;

        return {
          ...student,
          assignmentStats: {
            total: totalAssignments,
            submitted: submittedCount,
            graded: gradedCount,
            overdue: overdueCount,
            averageGrade: Math.round(averageGrade * 100) / 100
          },
          recentSubmissions: studentSubmissions.slice(0, 3)
        };
      });

      setStudents(studentsWithStats);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filter) {
      case 'active':
        return student.assignmentStats.submitted > 0;
      case 'behind':
        return student.assignmentStats.overdue > 0;
      case 'excellent':
        return student.assignmentStats.averageGrade >= 90;
      default:
        return true;
    }
  });

  const getStatusBadge = (student: Student) => {
    if (student.assignmentStats.overdue > 0) {
      return <Badge variant="destructive">Behind</Badge>;
    }
    if (student.assignmentStats.averageGrade >= 90) {
      return <Badge className="bg-green-600">Excellent</Badge>;
    }
    if (student.assignmentStats.submitted > 0) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Not Started</Badge>;
  };

  const getProgressColor = (submitted: number, total: number) => {
    const percentage = total > 0 ? (submitted / total) * 100 : 0;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            Monitor student progress and assignment completion
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {filteredStudents.length} Students
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={filter === 'behind' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('behind')}
          >
            Behind
          </Button>
          <Button
            variant={filter === 'excellent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('excellent')}
          >
            Excellent
          </Button>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{student.full_name}</CardTitle>
                    <CardDescription className="text-sm">
                      {student.email}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(student)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assignment Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Assignment Progress</span>
                  <span className="font-medium">
                    {student.assignmentStats.submitted}/{student.assignmentStats.total}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                      student.assignmentStats.submitted,
                      student.assignmentStats.total
                    )}`}
                    style={{
                      width: `${student.assignmentStats.total > 0 
                        ? (student.assignmentStats.submitted / student.assignmentStats.total) * 100 
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{student.assignmentStats.graded} Graded</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>{student.assignmentStats.submitted - student.assignmentStats.graded} Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>{student.assignmentStats.overdue} Overdue</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span>{student.assignmentStats.averageGrade}% Avg</span>
                </div>
              </div>

              {/* Recent Submissions */}
              {student.recentSubmissions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recent Submissions</h4>
                  <div className="space-y-1">
                    {student.recentSubmissions.map((submission, index) => (
                      <div key={index} className="text-xs text-muted-foreground flex items-center justify-between">
                        <span className="truncate">
                          {submission.assignment?.title || 'Assignment'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {submission.grade ? `${submission.grade}%` : 'Ungraded'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <FileText className="h-3 w-3 mr-1" />
                  View Work
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Progress
                </Button>
              </div>

              {/* Warning for students behind */}
              {student.assignmentStats.overdue > 0 && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{student.assignmentStats.overdue} overdue assignment{student.assignmentStats.overdue > 1 ? 's' : ''}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No students found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'No students have been registered yet'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Students;