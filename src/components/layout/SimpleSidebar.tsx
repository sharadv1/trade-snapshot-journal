
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart, BookOpen, LayoutDashboard, Lightbulb, PlusCircle, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SimpleSidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <aside className="group/sidebar hidden md:flex flex-col w-[220px] border-r bg-background transition-all duration-300 ease-in-out print:hidden">
      <nav className="flex flex-col gap-4 p-4">
        <Link
          to="/"
          className={cn(
            "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium",
            isActive("/") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        <Link
          to="/trade/new"
          className={cn(
            "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium",
            isActive("/trade/new") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <PlusCircle className="h-5 w-5" />
          <span>Add Trade</span>
        </Link>
        <Link
          to="/analytics"
          className={cn(
            "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium",
            isActive("/analytics") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <BarChart className="h-5 w-5" />
          <span>Analytics</span>
        </Link>
        <Link
          to="/ideas"
          className={cn(
            "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium",
            isActive("/ideas") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Lightbulb className="h-5 w-5" />
          <span>Ideas</span>
        </Link>
        <Link
          to="/strategies"
          className={cn(
            "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium",
            isActive("/strategies") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <BookOpen className="h-5 w-5" />
          <span>Strategies</span>
        </Link>
        <Link
          to="/symbols"
          className={cn(
            "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium",
            isActive("/symbols") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Tag className="h-5 w-5" />
          <span>Symbols</span>
        </Link>
      </nav>
    </aside>
  );
}
