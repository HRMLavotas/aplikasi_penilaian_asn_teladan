import { useEffect } from "react";
import { useNavigate, Outlet, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  TrendingUp,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function LegacyAsnTeladanSidebar() {
  const navigate = useNavigate();
  const { open } = useSidebar();

  const menuItems = [
    {
      title: "Dashboard",
      url: "/evaluasi",
      icon: LayoutDashboard,
    },
    {
      title: "Data Pegawai",
      url: "/pegawai",
      icon: Users,
    },
    {
      title: "Ranking",
      url: "/ranking",
      icon: TrendingUp,
    },
    {
      title: "Laporan",
      url: "/laporan",
      icon: FileText,
    },
  ];

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-accent";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Header Section */}
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="w-full justify-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {open && "Kembali ke Portal"}
          </Button>
        </div>

        {/* Assessment Info */}
        {open && (
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm mb-1">ASN Teladan</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Sistem Penilaian ASN Teladan
            </p>
          </div>
        )}

        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function LegacyAsnTeladanLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <LegacyAsnTeladanSidebar />
        <main className="flex-1 overflow-auto">
          {/* Global trigger in header */}
          <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex items-center px-4">
            <SidebarTrigger />
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
