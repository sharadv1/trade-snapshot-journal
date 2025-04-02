
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, BarChart } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import {
  BarChartBig,
  Calendar,
  Home,
  PencilRuler,
  Sparkles,
  Book,
  Tags
} from "lucide-react";

// Define the app version - increment this before pushing changes to git
// Format: MAJOR.MINOR.PATCH
// MAJOR: Breaking changes
// MINOR: New features, no breaking changes
// PATCH: Bug fixes and minor updates
export const APP_VERSION = "1.1.2";

export function Header() {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <BarChart className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Trade Journal <span className="text-xs font-normal text-muted-foreground">v{APP_VERSION}</span>
            </span>
          </Link>
        </div>
        
        {isMobile ? (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-auto md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-4">
              <div className="pt-10">
                <MobileNavItems onItemClick={() => setIsMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </header>
  );
}

function MobileNavItems({ onItemClick }: { onItemClick: () => void }) {
  return (
    <div className="flex flex-col space-y-3">
      <MobileNavItem to="/" icon={<Home size={18} />} label="Dashboard" onClick={onItemClick} />
      <MobileNavItem to="/analytics" icon={<BarChartBig size={18} />} label="Analytics" onClick={onItemClick} />
      <MobileNavItem to="/trade/new" icon={<PencilRuler size={18} />} label="New Trade" onClick={onItemClick} />
      <MobileNavItem to="/journal" icon={<Book size={18} />} label="Journal" onClick={onItemClick} />
      <MobileNavItem to="/ideas" icon={<Sparkles size={18} />} label="Ideas" onClick={onItemClick} />
      <MobileNavItem to="/strategies" icon={<Calendar size={18} />} label="Strategies" onClick={onItemClick} />
      <MobileNavItem to="/symbols" icon={<Tags size={18} />} label="Symbols" onClick={onItemClick} />
    </div>
  );
}

function MobileNavItem({ 
  to, 
  icon, 
  label,
  onClick 
}: { 
  to: string; 
  icon: React.ReactNode; 
  label: string;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-base transition-all hover:bg-accent ${
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
