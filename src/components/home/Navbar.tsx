import { Button } from '@/components/ui/button';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-violet-100/30 backdrop-blur-md supports-[backdrop-filter]:bg-violet-100/20 border-b border-violet-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">Smart Student Portal</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Assignment Management</p>
            </div>
          </div>


          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/student-auth">
              <Button variant="outline">Student Login</Button>
            </Link>
            <Link to="/teacher-auth">
              <Button>Teacher Login</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-violet-100/20 backdrop-blur-md border-t border-violet-200/50">
            <div className="flex flex-col space-y-2 px-3 pt-4">
              <Link to="/student-auth">
                <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                  Student Login
                </Button>
              </Link>
              <Link to="/teacher-auth">
                <Button className="w-full" onClick={() => setIsOpen(false)}>
                  Teacher Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}