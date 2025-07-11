import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  useActivityTracker,
  createActivityHelpers,
} from "@/hooks/useActivityTracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logActivity } = useActivityTracker();
  const activityHelpers = createActivityHelpers(logActivity);

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login Gagal",
            description:
              "Email atau password tidak valid. Silakan periksa kembali.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      // Log successful login activity
      activityHelpers.logLogin();

      toast({
        title: "Login Berhasil",
        description: "Selamat datang di sistem evaluasi ASN!",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat login. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (
    email: string,
    password: string,
    namaLengkap: string,
    username: string,
  ) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nama_lengkap: namaLengkap,
            username: username,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Akun Sudah Terdaftar",
            description:
              "Email ini sudah terdaftar. Silakan login atau gunakan email lain.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      // Log successful registration activity
      activityHelpers.logCreate("user", "", `Registrasi akun baru: ${email}`, {
        email,
        namaLengkap,
        username,
      });

      toast({
        title: "Registrasi Berhasil",
        description:
          "Akun berhasil dibuat. Silakan periksa email untuk konfirmasi.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat registrasi. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const SignInForm = () => {
    const [formData, setFormData] = useState({
      email: "",
      password: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.email || !formData.password) {
        toast({
          title: "Form Tidak Lengkap",
          description: "Silakan isi semua field yang diperlukan.",
          variant: "destructive",
        });
        return;
      }
      handleSignIn(formData.email, formData.password);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signin-email">Email</Label>
          <Input
            id="signin-email"
            type="email"
            placeholder="nama@kementerian.go.id"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signin-password">Password</Label>
          <div className="relative">
            <Input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Memproses..." : "Masuk"}
        </Button>
      </form>
    );
  };

  const SignUpForm = () => {
    const [formData, setFormData] = useState({
      email: "",
      password: "",
      confirmPassword: "",
      namaLengkap: "",
      username: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (
        !formData.email ||
        !formData.password ||
        !formData.namaLengkap ||
        !formData.username
      ) {
        toast({
          title: "Form Tidak Lengkap",
          description: "Silakan isi semua field yang diperlukan.",
          variant: "destructive",
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Password Tidak Cocok",
          description: "Password dan konfirmasi password harus sama.",
          variant: "destructive",
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Password Terlalu Pendek",
          description: "Password minimal 6 karakter.",
          variant: "destructive",
        });
        return;
      }

      handleSignUp(
        formData.email,
        formData.password,
        formData.namaLengkap,
        formData.username,
      );
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-nama">Nama Lengkap</Label>
          <Input
            id="signup-nama"
            type="text"
            placeholder="Nama lengkap sesuai identitas"
            value={formData.namaLengkap}
            onChange={(e) =>
              setFormData({ ...formData, namaLengkap: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-username">Username</Label>
          <Input
            id="signup-username"
            type="text"
            placeholder="Username unik"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="nama@kementerian.go.id"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 6 karakter"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-confirm-password">Konfirmasi Password</Label>
          <Input
            id="signup-confirm-password"
            type="password"
            placeholder="Ulangi password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Memproses..." : "Daftar"}
        </Button>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">ASN Insight Hub</CardTitle>
          <CardDescription>
            Sistem Evaluasi dan Eliminasi Aparatur Sipil Negara
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="space-y-4">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="space-y-4">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
