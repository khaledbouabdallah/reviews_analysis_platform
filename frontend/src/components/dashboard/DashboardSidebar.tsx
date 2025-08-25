import { NavLink, useLocation } from "react-router-dom";
import {
  Building2,
  BarChart3,
  Users,
  Settings,
  Home,
  MapPin,
  Star,
  Zap,
  Mail,
  Play,
  BookOpen
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Overview", url: "/dashboard", icon: Home, exact: true },
  { title: "Businesses", url: "/dashboard/businesses", icon: Building2 },
  { title: "Locations", url: "/dashboard/locations", icon: MapPin },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Campaigns", url: "/dashboard/campaigns", icon: Mail },
  { title: "Jobs", url: "/dashboard/jobs", icon: Play },
  { title: "Documentation", url: "/dashboard/documentation", icon: BookOpen },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
            <Star className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-primary">Review<span className="text-accent">oly</span></h2>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive: navActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${navActive || isActive(item.url, item.exact)
                          ? "bg-primary/10 text-primary font-medium shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <div className={`p-4 ${collapsed ? "px-2" : ""}`}>
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-3">
                {!collapsed ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Pro Plan</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Unlimited reviews & analytics
                    </p>
                  </div>
                ) : (
                  <Zap className="h-4 w-4 text-primary mx-auto" />
                )}
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
