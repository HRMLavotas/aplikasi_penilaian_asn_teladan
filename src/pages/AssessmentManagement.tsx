import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Settings, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AssessmentTemplate {
  id: string;
  nama_assessment: string;
  deskripsi: string | null;
  assessment_type: "asn_teladan" | "flexing" | "custom";
  is_active: boolean;
  formula_perhitungan: string | null;
  created_at: string;
}

export default function AssessmentManagement() {
  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AssessmentTemplate | null>(null);
  const [formData, setFormData] = useState<{
    nama_assessment: string;
    deskripsi: string;
    assessment_type: "asn_teladan" | "flexing" | "custom";
    is_active: boolean;
  }>({
    nama_assessment: "",
    deskripsi: "",
    assessment_type: "custom",
    is_active: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["assessment-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AssessmentTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("assessment_templates").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-templates"] });
      toast({ title: "Template assessment berhasil dibuat" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membuat template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("assessment_templates")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-templates"] });
      toast({ title: "Template berhasil diperbarui" });
      setOpen(false);
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal memperbarui template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("assessment_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment-templates"] });
      toast({ title: "Template berhasil dihapus" });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      nama_assessment: "",
      deskripsi: "",
      assessment_type: "custom",
      is_active: true,
    });
    setEditingTemplate(null);
  };

  const handleSubmit = () => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (template: AssessmentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      nama_assessment: template.nama_assessment,
      deskripsi: template.deskripsi || "",
      assessment_type: template.assessment_type,
      is_active: template.is_active,
    });
    setOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      asn_teladan: "ASN Teladan",
      flexing: "Flexing",
      custom: "Custom",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Kelola Assessment</h1>
              <p className="text-muted-foreground">
                Buat dan kelola template assessment
              </p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Template Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Edit Template" : "Buat Template Baru"}
                </DialogTitle>
                <DialogDescription>
                  Buat template assessment dengan kriteria penilaian yang dapat disesuaikan
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nama">Nama Assessment</Label>
                  <Input
                    id="nama"
                    value={formData.nama_assessment}
                    onChange={(e) =>
                      setFormData({ ...formData, nama_assessment: e.target.value })
                    }
                    placeholder="Contoh: Penilaian Flexing 2025"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    value={formData.deskripsi}
                    onChange={(e) =>
                      setFormData({ ...formData, deskripsi: e.target.value })
                    }
                    placeholder="Deskripsi singkat tentang assessment ini"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipe Assessment</Label>
                  <Select
                    value={formData.assessment_type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, assessment_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="flexing">Flexing</SelectItem>
                      <SelectItem value="asn_teladan" disabled>
                        ASN Teladan (Reserved)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Status Aktif</Label>
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.nama_assessment ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  {editingTemplate ? "Simpan Perubahan" : "Buat Template"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates?.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{template.nama_assessment}</CardTitle>
                      <CardDescription>
                        {getTypeLabel(template.assessment_type)}
                      </CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      template.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}>
                      {template.is_active ? "Aktif" : "Nonaktif"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.deskripsi || "Tidak ada deskripsi"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/assessment/${template.id}/criteria`)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Kriteria
                    </Button>
                    {template.assessment_type !== "asn_teladan" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm("Yakin ingin menghapus template ini?")) {
                              deleteMutation.mutate(template.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
