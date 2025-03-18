import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { BarChart, BookOpen, LayoutDashboard, Lightbulb, PlusCircle, Tag } from "lucide-react";

import { useMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function Header() {
  const location = useLocation();
  const isMobile = useMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <BarChart className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Trade Journal
            </span>
          </Link>
          
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              to="/"
              className={cn(
                "transition-colors hover:text-foreground/80",
                location.pathname === "/" ? "text-foreground" : "text-foreground/60"
              )}
            >
              Dashboard
            </Link>
            <Link
              to="/trade/new"
              className={cn(
                "transition-colors hover:text-foreground/80",
                location.pathname === "/trade/new" ? "text-foreground" : "text-foreground/60"
              )}
            >
              Add Trade
            </Link>
            <Link
              to="/analytics"
              className={cn(
                "transition-colors hover:text-foreground/80",
                location.pathname === "/analytics" ? "text-foreground" : "text-foreground/60"
              )}
            >
              Analytics
            </Link>
            <Link
              to="/ideas"
              className={cn(
                "transition-colors hover:text-foreground/80",
                location.pathname === "/ideas" ? "text-foreground" : "text-foreground/60"
              )}
            >
              Ideas
            </Link>
            <Link
              to="/strategies"
              className={cn(
                "transition-colors hover:text-foreground/80",
                location.pathname === "/strategies" ? "text-foreground" : "text-foreground/60"
              )}
            >
              Strategies
            </Link>
            <Link
              to="/symbols"
              className={cn(
                "transition-colors hover:text-foreground/80",
                location.pathname === "/symbols" ? "text-foreground" : "text-foreground/60"
              )}
            >
              Symbols
            </Link>
          </nav>
        </div>
        
        {isMobile ? (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-auto md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </header>
  );
}
