import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  MessageSquare, 
  BookOpen,
  CheckSquare,
  User,
  ClipboardList
} from 'lucide-react';

const teacherNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Assignments', url: '/assignments', icon: FileText },
  { title: 'Grading', url: '/grading', icon: CheckSquare },
  { title: 'Rubrics', url: '/rubrics', icon: ClipboardList },
  { title: 'Students', url: '/students', icon: Users },
  { title: 'Messages', url: '/messages', icon: MessageSquare },
];

const studentNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Assignments', url: '/assignments', icon: BookOpen },
  { title: 'Messages', url: '/messages', icon: MessageSquare },
  { title: 'Progress', url: '/progress', icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = profile?.role === 'teacher' ? teacherNavItems : studentNavItems;
  const collapsed = state === 'collapsed';
  
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50';

  return (
    <Sidebar className={collapsed ? 'w-16' : 'w-64'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {profile?.role === 'teacher' ? 'Teacher Tools' : 'Student Tools'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/profile" className={getNavCls}>
                    <User className="h-4 w-4" />
                    {!collapsed && <span>Profile</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}