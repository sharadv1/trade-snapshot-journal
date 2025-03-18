
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from './Header';
import { SimpleSidebar } from './SimpleSidebar';

export function Layout({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <Header />
        <div className="flex flex-1">
          <SimpleSidebar />
          <main className="flex-1 pt-16 px-4 md:px-6 max-w-7xl w-full mx-auto animate-fade-in">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
