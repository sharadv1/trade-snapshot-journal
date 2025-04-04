
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from './Header';
import { SimpleSidebar } from './SimpleSidebar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 h-[calc(100vh-64px)]">
          <div className="h-full">
            <SimpleSidebar />
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="container mx-auto max-w-7xl">
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
