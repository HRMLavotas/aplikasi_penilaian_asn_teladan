import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Award, TrendingUp, ArrowRight } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        setUser(null);
        return;
      }

      setUser(session?.user ?? null);

      if (session) {
        navigate("/dashboard");
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const features = [
    {
      icon: Users,
      title: "Manajemen Pegawai",
      description:
        "Kelola data pegawai ASN secara terpusat dengan sistem yang terintegrasi",
    },
    {
      icon: Award,
      title: "Evaluasi Komprehensif",
      description:
        "Penilaian multi-aspek untuk mengidentifikasi ASN teladan dan yang perlu pembinaan",
    },
    {
      icon: TrendingUp,
      title: "Analisis AI",
      description:
        "Sistem analisis cerdas untuk memberikan insight mendalam tentang performa pegawai",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">ASN Insight Hub</h1>
                <p className="text-sm text-muted-foreground">
                  Kementerian Ketenagakerjaan RI
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Masuk
              </Button>
              <Button onClick={() => navigate("/auth")}>Daftar</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            Sistem Evaluasi ASN Terpadu
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Sistem Evaluasi dan Eliminasi Aparatur Sipil Negara
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Platform digital untuk mengidentifikasi ASN teladan dan melakukan
            pembinaan berkelanjutan dengan teknologi AI yang canggih dan
            analisis data komprehensif
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="group"
            >
              Mulai Sekarang
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline">
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Fitur Unggulan</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sistem terintegrasi dengan teknologi terdepan untuk evaluasi ASN
            yang objektif dan transparan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="text-center group hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-muted-foreground">Akurasi Sistem</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">9</div>
              <div className="text-muted-foreground">Aspek Penilaian</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Sistem Aktif</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">AI</div>
              <div className="text-muted-foreground">Analisis Cerdas</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="text-center max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">
              Siap Memulai Evaluasi ASN?
            </CardTitle>
            <CardDescription className="text-base">
              Bergabunglah dengan sistem evaluasi ASN yang modern dan efisien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="group"
            >
              Daftar Sekarang
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold">ASN Insight Hub</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Kementerian Ketenagakerjaan RI. Semua hak dilindungi.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
