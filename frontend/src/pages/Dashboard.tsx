import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BusinessProvider } from "@/contexts/BusinessContext";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Create query client outside component (important!)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
})

const Dashboard = () => {
  return (
    <QueryClientProvider client={queryClient}>  {/* ← Add this wrapper */}
      <BusinessProvider>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <DashboardSidebar />
            <div className="flex-1 flex flex-col">
              <DashboardHeader />
              <main className="flex-1 p-6 overflow-auto">
                <Outlet />
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BusinessProvider>

      {/* Dev tools - only shows in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default Dashboard;