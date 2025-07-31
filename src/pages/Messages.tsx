import { MessageList, ComposeMessageDialog } from '@/components/messaging/MessageComponents';
import { MessageCircle } from 'lucide-react';

const Messages = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with teachers and students about assignments and coursework
          </p>
        </div>
        <ComposeMessageDialog />
      </div>

      <MessageList />
    </div>
  );
};

export default Messages;