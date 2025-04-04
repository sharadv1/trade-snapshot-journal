
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart4, 
  BookOpen, 
  Calendar,
  Home, 
  LayoutDashboard, 
  Lightbulb, 
  LineChart, 
  Settings, 
  Tags
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarMenu, 
  SidebarGroup, 
  SidebarMenuItem, 
  SidebarMenuButton
} from '@/components/ui/sidebar';

export function SimpleSidebar() {
  return (
    <Sidebar>
      <SidebarContent className="mt-14 pt-4">
        <SidebarMenu>
          <SidebarGroup>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/analytics" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <BarChart4 className="h-5 w-5" />
                  <span>Analytics</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/journal" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <Calendar className="h-5 w-5" />
                  <span>Journal</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/ideas" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <Lightbulb className="h-5 w-5" />
                  <span>Ideas</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/lessons" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <BookOpen className="h-5 w-5" />
                  <span>Lessons</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/strategies" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <LineChart className="h-5 w-5" />
                  <span>Strategies</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/symbols" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <Tags className="h-5 w-5" />
                  <span>Symbols</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/configs" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
