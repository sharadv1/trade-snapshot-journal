import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, BarChart } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

// Define the app version - increment this before pushing changes to git
// Format: MAJOR.MINOR.PATCH
// MAJOR: Breaking changes
// MINOR: New features, no breaking changes
// PATCH: Bug fixes and minor updates
export const APP_VERSION = "1.0.4";

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
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </header>
  );
}
