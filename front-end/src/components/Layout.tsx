import { Navbar } from "@/components/Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
