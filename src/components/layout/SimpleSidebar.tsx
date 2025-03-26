
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BarChartBig, 
  Calendar, 
  Home, 
  PencilRuler, 
  Sparkles, 
  Book,
  Tags,
  CircleSlash 
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

export function SimpleSidebar() {
  const { state } = useSidebar();
  
  // In the updated sidebar component, we should use the 'state' property
  // instead of 'isOpen' to determine if the sidebar is expanded
  if (state === "collapsed") return null;
  
  return (
    <div className="hidden md:block w-64 shrink-0 border-r pt-16 bg-background z-10">
      <div className="space-y-1 p-2">
        <NavItem to="/" icon={<Home size={18} />} label="Dashboard" />
        <NavItem to="/analytics" icon={<BarChartBig size={18} />} label="Analytics" />
        <NavItem to="/trade/new" icon={<PencilRuler size={18} />} label="New Trade" />
        <NavItem to="/journal" icon={<Book size={18} />} label="Weekly Journal" />
        <NavItem to="/ideas" icon={<Sparkles size={18} />} label="Ideas" />
        <NavItem to="/strategies" icon={<Calendar size={18} />} label="Strategies" />
        <NavItem to="/symbols" icon={<Tags size={18} />} label="Symbols" />
      </div>
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent ${
          isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>
            {icon}
          </span>
          <span className={isActive ? 'font-medium text-foreground' : ''}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
