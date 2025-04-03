
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LineChart, Lightbulb, BarChart3, BookOpen, Map, Tag, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

export function SimpleSidebar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigationItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: 'Home' },
    { name: 'Trades', href: '/trade/new', icon: 'LineChart' },
    { name: 'Trade Ideas', href: '/ideas', icon: 'Lightbulb' },
    { name: 'Analytics', href: '/analytics', icon: 'BarChart3' },
    { name: 'Journal', href: '/journal', icon: 'BookOpen' },
    { name: 'Strategies', href: '/strategies', icon: 'Map' },
    { name: 'Symbols', href: '/symbols', icon: 'Tag' },
    { name: 'Configs', href: '/configs', icon: 'Settings' }
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return <Home className="h-4 w-4" />;
      case 'LineChart': return <LineChart className="h-4 w-4" />;
      case 'Lightbulb': return <Lightbulb className="h-4 w-4" />;
      case 'BarChart3': return <BarChart3 className="h-4 w-4" />;
      case 'BookOpen': return <BookOpen className="h-4 w-4" />;
      case 'Map': return <Map className="h-4 w-4" />;
      case 'Tag': return <Tag className="h-4 w-4" />;
      case 'Settings': return <Settings className="h-4 w-4" />;
      default: return null;
    }
  };

  // Desktop sidebar
  const DesktopSidebar = () => (
    <div className="hidden md:flex flex-col w-64 bg-background border-r h-full overflow-y-auto">
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold">Trading Journal</h2>
      </div>
      <nav className="flex-1">
        <ul className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 py-2 px-3 rounded-md transition-colors duration-200',
                  location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))
                    ? 'bg-secondary text-secondary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {getIcon(item.icon)}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );

  // Mobile sidebar with Sheet
  return (
    <>
      <DesktopSidebar />
      
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
            <Home className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <nav className="flex flex-col h-full">
            <div className="px-4 py-6 flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2 font-semibold">
                <Home className="h-6 w-6" />
                <span>Trading Journal</span>
              </Link>
            </div>
            <div className="flex-grow p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center space-x-3 py-2 px-4 rounded-md transition-colors duration-200',
                        location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))
                          ? 'bg-secondary text-secondary-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      )}
                      onClick={closeMenu}
                    >
                      {getIcon(item.icon)}
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
