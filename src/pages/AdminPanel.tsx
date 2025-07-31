import { CreateStudentDialog } from '@/components/admin/CreateStudentDialog';

const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Create and manage users for the Smart Student Portal
          </p>
        </div>
        
        <CreateStudentDialog />
        
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Users created here will receive login credentials and can access the portal immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;