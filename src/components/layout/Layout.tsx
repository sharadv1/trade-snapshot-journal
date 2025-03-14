
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <Header />
        <main className="flex-1 pt-16 px-4 md:px-6 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
