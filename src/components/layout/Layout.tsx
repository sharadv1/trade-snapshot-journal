
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <Header />
        <main className="flex-1 pt-16 px-4 md:px-6 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
