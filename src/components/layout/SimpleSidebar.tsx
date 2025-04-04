
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
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuGroup, SidebarMenuItem, SidebarMenuItemButton, SidebarMenuItemIcon, SidebarMenuItemLabel } from '@/components/ui/sidebar';

export function SimpleSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuGroup>
            <SidebarMenuItem>
              <SidebarMenuItemButton asChild>
                <NavLink to="/" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <SidebarMenuItemIcon>
                    <LayoutDashboard className="h-5 w-5" />
                  </SidebarMenuItemIcon>
                  <SidebarMenuItemLabel>
                    Dashboard
                  </SidebarMenuItemLabel>
                </NavLink>
              </SidebarMenuItemButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuItemButton asChild>
                <NavLink to="/analytics" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <SidebarMenuItemIcon>
                    <BarChart4 className="h-5 w-5" />
                  </SidebarMenuItemIcon>
                  <SidebarMenuItemLabel>
                    Analytics
                  </SidebarMenuItemLabel>
                </NavLink>
              </SidebarMenuItemButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuItemButton asChild>
                <NavLink to="/journal" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <SidebarMenuItemIcon>
                    <Calendar className="h-5 w-5" />
                  </SidebarMenuItemIcon>
                  <SidebarMenuItemLabel>
                    Journal
                  </SidebarMenuItemLabel>
                </NavLink>
              </SidebarMenuItemButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuItemButton asChild>
                <NavLink to="/ideas" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <SidebarMenuItemIcon>
                    <Lightbulb className="h-5 w-5" />
                  </SidebarMenuItemIcon>
                  <SidebarMenuItemLabel>
                    Ideas
                  </SidebarMenuItemLabel>
                </NavLink>
              </SidebarMenuItemButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuItemButton asChild>
                <NavLink to="/lessons" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <SidebarMenuItemIcon>
                    <BookOpen className="h-5 w-5" />
                  </SidebarMenuItemIcon>
                  <SidebarMenuItemLabel>
                    Lessons
                  </SidebarMenuItemLabel>
                </NavLink>
              </SidebarMenuItemButton>
            </SidebarMenuItem>
          </SidebarMenuGroup>
          <SidebarMenuGroup>
            <SidebarMenuItem>
              <SidebarMenuItemButton asChild>
                <NavLink to="/strategies" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <SidebarMenuItemIcon>
                    <LineChart className="h-5 w-5" />
                  </SidebarMenuItemIcon>
                  <SidebarMenuItemLabel>
                    Strategies
                  </SidebarMenuItemLabel>
                </NavLink>
              </SidebarMenuItemButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuItemButton asChild>
                <NavLink to="/symbols" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <SidebarMenuItemIcon>
                    <Tags className="h-5 w-5" />
                  </SidebarMenuItemIcon>
                  <SidebarMenuItemLabel>
                    Symbols
                  </SidebarMenuItemLabel>
                </NavLink>
              </SidebarMenuItemButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuItemButton asChild>
                <NavLink to="/configs" className={({ isActive }) => isActive ? 'text-primary' : ''}>
                  <SidebarMenuItemIcon>
                    <Settings className="h-5 w-5" />
                  </SidebarMenuItemIcon>
                  <SidebarMenuItemLabel>
                    Settings
                  </SidebarMenuItemLabel>
                </NavLink>
              </SidebarMenuItemButton>
            </SidebarMenuItem>
          </SidebarMenuGroup>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
