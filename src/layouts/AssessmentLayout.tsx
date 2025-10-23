import { useEffect, useState } from "react";
import { useNavigate, useParams, Outlet, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  Settings,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssessmentTemplate {
  id: string;
  nama_assessment: string;
  deskripsi: string;
  assessment_type: string;
}

export function AssessmentSidebar() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const [assessment, setAssessment] = useState<AssessmentTemplate | null>(null);

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const loadAssessment = async () => {
    if (!assessmentId) return;
    
    try {
      const { data, error } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (error) throw error;
      setAssessment(data);
    } catch (error) {
      console.error('Error loading assessment:', error);
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      url: `/assessment/${assessmentId}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      title: "Data Pegawai",
      url: `/assessment/${assessmentId}/pegawai`,
      icon: Users,
    },
    {
      title: "Evaluasi",
      url: `/assessment/${assessmentId}/evaluasi`,
      icon: ClipboardCheck,
    },
    {
      title: "Ranking",
      url: `/assessment/${assessmentId}/ranking`,
      icon: TrendingUp,
    },
    {
      title: "Laporan",
      url: `/assessment/${assessmentId}/laporan`,
      icon: FileText,
    },
  ];

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-accent";

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"} collapsible="icon">
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
            {state !== "collapsed" && "Kembali ke Portal"}
          </Button>
        </div>

        {/* Assessment Info */}
        {state !== "collapsed" && assessment && (
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm mb-1">{assessment.nama_assessment}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {assessment.deskripsi}
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
                      <item.icon className={`h-4 w-4 ${state === "collapsed" ? "" : "mr-2"}`} />
                      {state !== "collapsed" && <span>{item.title}</span>}
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

export default function AssessmentLayout() {
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
        <AssessmentSidebar />
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
