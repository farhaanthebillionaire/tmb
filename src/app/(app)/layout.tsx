// src/app/(app)/layout.tsx
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"; // Import SidebarTrigger
import { FoodLogProvider } from "@/contexts/FoodLogContext";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button"; // For styling trigger if needed
import { PanelLeftOpen } from "lucide-react"; // Icon for trigger

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FoodLogProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen flex-col bg-background">
          {/* Header for mobile trigger, only visible on mobile */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <SidebarTrigger asChild>
              <Button size="icon" variant="outline" className="md:hidden">
                <PanelLeftOpen className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SidebarTrigger>
            {/* You can add a logo or title here for mobile header if desired */}
          </header>

          <div className="flex flex-1 overflow-hidden">
            <AppSidebar />
            <main
              className="flex-1 flex flex-col overflow-y-auto no-scrollbar
                         md:pl-[var(--sidebar-width-icon)] 
                         group-data-[sidebar-state=expanded]/sidebar-wrapper:md:pl-[var(--sidebar-width)] 
                         transition-[padding-left] duration-300 ease-in-out"
            >
              <div className="w-full flex-grow pt-4 md:pt-6 lg:pt-8 pb-8 px-4 md:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
          <Footer />
        </div>
      </SidebarProvider>
    </FoodLogProvider>
  );
}
