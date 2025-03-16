
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart2, BookOpen, Home, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Header() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Journal', path: '/', icon: BookOpen },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
  ];
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b px-6 py-3",
        isScrolled 
          ? "glass-effect shadow-subtle" 
          : "bg-transparent border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-medium">Trade Journal</h1>
          <div className="h-4 w-px bg-border mx-4"></div>
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="hidden md:flex"
            asChild
          >
            <Link to="/trade/new">
              <Plus className="mr-1 h-4 w-4" />
              New Trade
            </Link>
          </Button>
          
          <Button size="icon" className="md:hidden" asChild>
            <Link to="/trade/new">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
