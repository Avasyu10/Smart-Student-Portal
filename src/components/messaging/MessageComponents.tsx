import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send, Eye, User, Book, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import ChatWindow from './ChatWindow';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject?: string;
  content: string;
  assignment_id?: string;
  submission_id?: string;
  read_at?: string;
  created_at: string;
  sender_profile?: {
    full_name: string;
    role: string;
  };
  recipient_profile?: {
    full_name: string;
    role: string;
  };
  assignment?: {
    title: string;
  };
}

interface Profile {
  user_id: string;
  full_name: string;
  role: string;
  email?: string;
}

interface Assignment {
  id: string;
  title: string;
}

export const MessageList = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatWindow, setChatWindow] = useState<{
    recipientId: string;
    recipientName: string;
    recipientRole: string;
  } | null>(null);

  useEffect(() => {
    if (profile) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [profile]);

  const fetchMessages = async () => {
    try {
      // First get the messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      // Get all unique user IDs
      const userIds = Array.from(new Set([
        ...messagesData.map(m => m.sender_id),
        ...messagesData.map(m => m.recipient_id)
      ]));

      // Get all unique assignment IDs
      const assignmentIds = messagesData
        .map(m => m.assignment_id)
        .filter(Boolean);

      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Fetch assignments if needed
      let assignmentsData: any[] = [];
      if (assignmentIds.length > 0) {
        const { data, error: assignmentsError } = await supabase
          .from('assignments')
          .select('id, title')
          .in('id', assignmentIds);
        
        if (assignmentsError) throw assignmentsError;
        assignmentsData = data || [];
      }

      // Combine the data
      const enrichedMessages = messagesData.map(message => ({
        ...message,
        sender_profile: profilesData.find(p => p.user_id === message.sender_id),
        recipient_profile: profilesData.find(p => p.user_id === message.recipient_id),
        assignment: message.assignment_id 
          ? assignmentsData.find(a => a.id === message.assignment_id)
          : undefined
      }));

      setMessages(enrichedMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${profile?.user_id},recipient_id=eq.${profile?.user_id}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('recipient_id', profile?.user_id);

      if (error) throw error;
      fetchMessages();
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  const openChat = (message: Message) => {
    const isFromCurrentUser = message.sender_id === profile?.user_id;
    const otherUser = isFromCurrentUser ? message.recipient_profile : message.sender_profile;
    
    if (otherUser) {
      setChatWindow({
        recipientId: isFromCurrentUser ? message.recipient_id : message.sender_id,
        recipientName: otherUser.full_name,
        recipientRole: otherUser.role
      });
    }
  };

  if (chatWindow) {
    return (
      <ChatWindow
        recipientId={chatWindow.recipientId}
        recipientName={chatWindow.recipientName}
        recipientRole={chatWindow.recipientRole}
        onClose={() => setChatWindow(null)}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground">No messages yet</p>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="border-l-4 border-l-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {message.sender_id === profile?.user_id
                        ? `To: ${message.recipient_profile?.full_name}`
                        : `From: ${message.sender_profile?.full_name}`}
                    </span>
                    <Badge variant="secondary">
                      {message.sender_profile?.role === 'teacher' ? 'Teacher' : 'Student'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {!message.read_at && message.recipient_id === profile?.user_id && (
                      <Badge variant="destructive">Unread</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(message.created_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                
                {message.subject && (
                  <h4 className="font-semibold mb-2">{message.subject}</h4>
                )}
                
                {message.assignment && (
                  <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                    <Book className="h-4 w-4" />
                    <span>Related to: {message.assignment.title}</span>
                  </div>
                )}
                
                <p className="text-sm">{message.content}</p>
                
                <div className="flex gap-2 mt-2">
                  {!message.read_at && message.recipient_id === profile?.user_id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(message.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Mark as Read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openChat(message)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export const ComposeMessageDialog = ({ preselectedRecipient }: { preselectedRecipient?: string }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipientId, setRecipientId] = useState(preselectedRecipient || '');
  const [assignmentId, setAssignmentId] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProfiles();
      fetchAssignments();
    }
  }, [open, profile]);

  useEffect(() => {
    if (preselectedRecipient) {
      setRecipientId(preselectedRecipient);
    }
  }, [preselectedRecipient]);

  const fetchProfiles = async () => {
    try {
      // Fetch teachers if user is student, students if user is teacher
      const targetRole = profile?.role === 'teacher' ? 'student' : 'teacher';
      
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, role, email')
        .eq('role', targetRole)
        .order('full_name');

      if (error) throw error;
      console.log('Fetched profiles:', data); // Debug log
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load user profiles",
        variant: "destructive",
      });
    }
  };

  const fetchAssignments = async () => {
    try {
      let query = supabase.from('assignments').select('id, title');
      
      // Teachers see their own assignments, students see active assignments
      if (profile?.role === 'teacher') {
        query = query.eq('created_by', profile.user_id);
      } else {
        query = query.eq('status', 'active');
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !recipientId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile?.user_id,
          recipient_id: recipientId,
          subject: subject.trim() || null,
          content: content.trim(),
          assignment_id: assignmentId || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully",
      });

      setOpen(false);
      setSubject('');
      setContent('');
      setRecipientId('');
      setAssignmentId('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Compose Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Compose New Message</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="recipient">
              {profile?.role === 'teacher' ? 'Select Student' : 'Select Teacher'}
            </Label>
            <Select value={recipientId} onValueChange={setRecipientId} required>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${profile?.role === 'teacher' ? 'student' : 'teacher'}`} />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {profiles.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground">
                    No {profile?.role === 'teacher' ? 'students' : 'teachers'} found
                  </div>
                ) : (
                  profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.full_name}</span>
                        <span className="text-sm text-muted-foreground">{p.email || 'No email'}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {profiles.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Debug: Looking for users with role = "{profile?.role === 'teacher' ? 'student' : 'teacher'}"
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="assignment">Assignment (Optional)</Label>
            <Select value={assignmentId} onValueChange={setAssignmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select related assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Subject (Optional)</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject"
            />
          </div>

          <div>
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};