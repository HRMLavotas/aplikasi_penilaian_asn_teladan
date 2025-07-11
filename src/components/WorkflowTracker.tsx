import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  ClipboardCheck,
  Trophy,
  TrendingUp,
} from "lucide-react";

interface WorkflowStats {
  totalPegawai: number;
  pegawaiTerdaftar: number;
  evaluasiSelesai: number;
  evaluasiPending: number;
  asnTeladan: number;
  progressPercentage: number;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: "completed" | "in-progress" | "pending";
  count: number;
  target?: number;
}

const WorkflowTracker = () => {
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkflowStats();
  }, []);

  const fetchWorkflowStats = async () => {
    try {
      const currentYear = new Date().getFullYear();

      // Get total pegawai
      const { count: totalPegawai } = await supabase
        .from("pegawai")
        .select("*", { count: "exact", head: true });

      // Get evaluations
      const { data: evaluations } = await supabase
        .from("penilaian")
        .select("pegawai_id, persentase_akhir")
        .eq("tahun_penilaian", currentYear);

      const evaluasiSelesai = evaluations?.length || 0;
      const evaluasiPending = (totalPegawai || 0) - evaluasiSelesai;
      const asnTeladan =
        evaluations?.filter((e) => (e.persentase_akhir || 0) >= 85).length || 0;
      const progressPercentage = totalPegawai
        ? (evaluasiSelesai / totalPegawai) * 100
        : 0;

      setStats({
        totalPegawai: totalPegawai || 0,
        pegawaiTerdaftar: totalPegawai || 0,
        evaluasiSelesai,
        evaluasiPending,
        asnTeladan,
        progressPercentage,
      });
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const workflowSteps: WorkflowStep[] = [
    {
      id: "registration",
      title: "Pendaftaran Pegawai",
      description: "Pegawai terdaftar dalam sistem",
      icon: Users,
      status: stats.pegawaiTerdaftar > 0 ? "completed" : "pending",
      count: stats.pegawaiTerdaftar,
    },
    {
      id: "evaluation",
      title: "Proses Evaluasi",
      description: "Evaluasi kinerja sedang berlangsung",
      icon: ClipboardCheck,
      status:
        stats.evaluasiSelesai === stats.totalPegawai
          ? "completed"
          : stats.evaluasiSelesai > 0
            ? "in-progress"
            : "pending",
      count: stats.evaluasiSelesai,
      target: stats.totalPegawai,
    },
    {
      id: "analysis",
      title: "Analisis & Ranking",
      description: "Analisis hasil dan penentuan ranking",
      icon: TrendingUp,
      status:
        stats.evaluasiSelesai === stats.totalPegawai ? "completed" : "pending",
      count: stats.evaluasiSelesai,
      target: stats.totalPegawai,
    },
    {
      id: "selection",
      title: "Seleksi ASN Teladan",
      description: "Penentuan ASN Teladan final",
      icon: Trophy,
      status: stats.asnTeladan > 0 ? "completed" : "pending",
      count: stats.asnTeladan,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "in-progress":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "in-progress":
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>
            Progress Evaluasi ASN Teladan {new Date().getFullYear()}
          </CardTitle>
          <CardDescription>
            Tracking keseluruhan proses evaluasi dan seleksi ASN teladan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress Keseluruhan</span>
              <span className="text-sm text-muted-foreground">
                {stats.evaluasiSelesai}/{stats.totalPegawai} evaluasi selesai
              </span>
            </div>
            <Progress value={stats.progressPercentage} className="h-2" />
            <div className="text-right text-sm text-muted-foreground">
              {stats.progressPercentage.toFixed(1)}% selesai
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Tahapan Workflow</CardTitle>
          <CardDescription>
            Status setiap tahapan dalam proses evaluasi ASN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowSteps.map((step, index) => {
              const StatusIcon = getStatusIcon(step.status);
              const isLast = index === workflowSteps.length - 1;

              return (
                <div key={step.id} className="relative">
                  <div className="flex items-start space-x-4">
                    {/* Status Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(step.status)}`}
                    >
                      <StatusIcon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">{step.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              step.status === "completed"
                                ? "default"
                                : step.status === "in-progress"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {step.status === "completed"
                              ? "Selesai"
                              : step.status === "in-progress"
                                ? "Berlangsung"
                                : "Menunggu"}
                          </Badge>
                          <span className="text-sm font-mono">
                            {step.count}
                            {step.target ? `/${step.target}` : ""}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>

                      {/* Progress bar for steps with targets */}
                      {step.target && step.target > 0 && (
                        <div className="mt-2">
                          <Progress
                            value={(step.count / step.target) * 100}
                            className="h-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div className="ml-5 mt-2 mb-2 w-px h-8 bg-border"></div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalPegawai}
              </div>
              <div className="text-sm text-muted-foreground">Total Pegawai</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.evaluasiSelesai}
              </div>
              <div className="text-sm text-muted-foreground">
                Evaluasi Selesai
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.evaluasiPending}
              </div>
              <div className="text-sm text-muted-foreground">
                Menunggu Evaluasi
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.asnTeladan}
              </div>
              <div className="text-sm text-muted-foreground">ASN Teladan</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowTracker;
