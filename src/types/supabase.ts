export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      assessment_criteria: {
        Row: {
          assessment_template_id: string
          bobot: number | null
          created_at: string
          deskripsi: string | null
          id: string
          is_required: boolean
          kode_kriteria: string
          max_value: number | null
          min_value: number | null
          nama_kriteria: string
          options: Json | null
          tipe_input: Database["public"]["Enums"]["criteria_input_type"]
          urutan: number
        }
        Insert: {
          assessment_template_id: string
          bobot?: number | null
          created_at?: string
          deskripsi?: string | null
          id?: string
          is_required?: boolean
          kode_kriteria: string
          max_value?: number | null
          min_value?: number | null
          nama_kriteria: string
          options?: Json | null
          tipe_input?: Database["public"]["Enums"]["criteria_input_type"]
          urutan?: number
        }
        Update: {
          assessment_template_id?: string
          bobot?: number | null
          created_at?: string
          deskripsi?: string | null
          id?: string
          is_required?: boolean
          kode_kriteria?: string
          max_value?: number | null
          min_value?: number | null
          nama_kriteria?: string
          options?: Json | null
          tipe_input?: Database["public"]["Enums"]["criteria_input_type"]
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_criteria_assessment_template_id_fkey"
            columns: ["assessment_template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_templates: {
        Row: {
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          created_at: string
          created_by: string | null
          deskripsi: string | null
          formula_perhitungan: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          nama_assessment: string
          updated_at: string
        }
        Insert: {
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          formula_perhitungan?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          nama_assessment: string
          updated_at?: string
        }
        Update: {
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          created_at?: string
          created_by?: string | null
          deskripsi?: string | null
          formula_perhitungan?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          nama_assessment?: string
          updated_at?: string
        }
        Relationships: []
      }
      pegawai: {
        Row: {
          bebas_temuan: boolean
          bebas_temuan_link: string | null
          bukti_inovasi: string | null
          bukti_penghargaan: string | null
          created_at: string
          drh_link: string | null
          id: string
          jabatan: string
          masa_kerja_tahun: number
          memiliki_inovasi: boolean
          memiliki_penghargaan: boolean
          nama: string
          nip: string
          skp_2_tahun_terakhir_baik_link: string | null
          skp_peningkatan_prestasi_link: string | null
          status_jabatan: string
          tidak_hukuman_disiplin: boolean
          tidak_hukuman_disiplin_link: string | null
          tidak_pemeriksaan_disiplin: boolean
          tidak_pemeriksaan_disiplin_link: string | null
          unit_kerja_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bebas_temuan?: boolean
          bebas_temuan_link?: string | null
          bukti_inovasi?: string | null
          bukti_penghargaan?: string | null
          created_at?: string
          drh_link?: string | null
          id?: string
          jabatan: string
          masa_kerja_tahun?: number
          memiliki_inovasi?: boolean
          memiliki_penghargaan?: boolean
          nama: string
          nip: string
          skp_2_tahun_terakhir_baik_link?: string | null
          skp_peningkatan_prestasi_link?: string | null
          status_jabatan: string
          tidak_hukuman_disiplin?: boolean
          tidak_hukuman_disiplin_link?: string | null
          tidak_pemeriksaan_disiplin?: boolean
          tidak_pemeriksaan_disiplin_link?: string | null
          unit_kerja_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bebas_temuan?: boolean
          bebas_temuan_link?: string | null
          bukti_inovasi?: string | null
          bukti_penghargaan?: string | null
          created_at?: string
          drh_link?: string | null
          id?: string
          jabatan?: string
          masa_kerja_tahun?: number
          memiliki_inovasi?: boolean
          memiliki_penghargaan?: boolean
          nama?: string
          nip?: string
          skp_2_tahun_terakhir_baik_link?: string | null
          skp_peningkatan_prestasi_link?: string | null
          status_jabatan?: string
          tidak_hukuman_disiplin?: boolean
          tidak_hukuman_disiplin_link?: string | null
          tidak_pemeriksaan_disiplin?: boolean
          tidak_pemeriksaan_disiplin_link?: string | null
          unit_kerja_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pegawai_unit_kerja_id_fkey"
            columns: ["unit_kerja_id"]
            isOneToOne: false
            referencedRelation: "unit_kerja"
            referencedColumns: ["id"]
          },
        ]
      }
      penilaian: {
        Row: {
          adaptif_desc: string | null
          akuntabel_desc: string | null
          analisis_ai_kekurangan: string | null
          analisis_ai_kelebihan: string | null
          analisis_ai_kontra: string | null
          analisis_ai_pro: string | null
          assessment_template_id: string
          bebas_temuan: boolean | null
          berorientasi_pelayanan_desc: string | null
          bukti_inovasi: string | null
          bukti_penghargaan: string | null
          created_at: string
          harmonis_desc: string | null
          id: string
          inovasi_dampak_score: number
          inspiratif_score: number
          integritas_moralitas_score: number
          is_data_valid: boolean | null
          kerjasama_kolaborasi_score: number
          kinerja_perilaku_score: number
          kolaboratif_desc: string | null
          kompeten_desc: string | null
          komunikasi_score: number
          leadership_score: number
          loyal_desc: string | null
          memiliki_inovasi: boolean | null
          memiliki_penghargaan: boolean | null
          original_score: number | null
          pegawai_id: string
          penilai_user_id: string
          persentase_akhir: number | null
          prestasi_score: number
          rekam_jejak_score: number
          skp_2_tahun_terakhir_baik: boolean
          skp_peningkatan_prestasi: boolean
          tahun_penilaian: number
          tidak_hukuman_disiplin: boolean | null
          tidak_pemeriksaan_disiplin: boolean | null
          updated_at: string
          verification_label: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          adaptif_desc?: string | null
          akuntabel_desc?: string | null
          analisis_ai_kekurangan?: string | null
          analisis_ai_kelebihan?: string | null
          analisis_ai_kontra?: string | null
          analisis_ai_pro?: string | null
          assessment_template_id: string
          bebas_temuan?: boolean | null
          berorientasi_pelayanan_desc?: string | null
          bukti_inovasi?: string | null
          bukti_penghargaan?: string | null
          created_at?: string
          harmonis_desc?: string | null
          id?: string
          inovasi_dampak_score: number
          inspiratif_score: number
          integritas_moralitas_score: number
          is_data_valid?: boolean | null
          kerjasama_kolaborasi_score: number
          kinerja_perilaku_score: number
          kolaboratif_desc?: string | null
          kompeten_desc?: string | null
          komunikasi_score: number
          leadership_score: number
          loyal_desc?: string | null
          memiliki_inovasi?: boolean | null
          memiliki_penghargaan?: boolean | null
          original_score?: number | null
          pegawai_id: string
          penilai_user_id: string
          persentase_akhir?: number | null
          prestasi_score: number
          rekam_jejak_score: number
          skp_2_tahun_terakhir_baik?: boolean
          skp_peningkatan_prestasi?: boolean
          tahun_penilaian?: number
          tidak_hukuman_disiplin?: boolean | null
          tidak_pemeriksaan_disiplin?: boolean | null
          updated_at?: string
          verification_label?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          adaptif_desc?: string | null
          akuntabel_desc?: string | null
          analisis_ai_kekurangan?: string | null
          analisis_ai_kelebihan?: string | null
          analisis_ai_kontra?: string | null
          analisis_ai_pro?: string | null
          assessment_template_id?: string
          bebas_temuan?: boolean | null
          berorientasi_pelayanan_desc?: string | null
          bukti_inovasi?: string | null
          bukti_penghargaan?: string | null
          created_at?: string
          harmonis_desc?: string | null
          id?: string
          inovasi_dampak_score?: number
          inspiratif_score?: number
          integritas_moralitas_score?: number
          is_data_valid?: boolean | null
          kerjasama_kolaborasi_score?: number
          kinerja_perilaku_score?: number
          kolaboratif_desc?: string | null
          kompeten_desc?: string | null
          komunikasi_score?: number
          leadership_score?: number
          loyal_desc?: string | null
          memiliki_inovasi?: boolean | null
          memiliki_penghargaan?: boolean | null
          original_score?: number | null
          pegawai_id?: string
          penilai_user_id?: string
          persentase_akhir?: number | null
          prestasi_score?: number
          rekam_jejak_score?: number
          skp_2_tahun_terakhir_baik?: boolean
          skp_peningkatan_prestasi?: boolean
          tahun_penilaian?: number
          tidak_hukuman_disiplin?: boolean | null
          tidak_pemeriksaan_disiplin?: boolean | null
          updated_at?: string
          verification_label?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "penilaian_assessment_template_id_fkey"
            columns: ["assessment_template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penilaian_pegawai_id_fkey"
            columns: ["pegawai_id"]
            isOneToOne: false
            referencedRelation: "pegawai"
            referencedColumns: ["id"]
          },
        ]
      }
      penilaian_detail: {
        Row: {
          catatan: string | null
          created_at: string
          criteria_id: string
          id: string
          nilai: Json
          penilaian_id: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          criteria_id: string
          id?: string
          nilai: Json
          penilaian_id: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          criteria_id?: string
          id?: string
          nilai?: Json
          penilaian_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "penilaian_detail_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "assessment_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penilaian_detail_penilaian_id_fkey"
            columns: ["penilaian_id"]
            isOneToOne: false
            referencedRelation: "penilaian"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nama_lengkap: string | null
          unit_kerja_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nama_lengkap?: string | null
          unit_kerja_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nama_lengkap?: string | null
          unit_kerja_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unit_kerja_id_fkey"
            columns: ["unit_kerja_id"]
            isOneToOne: false
            referencedRelation: "unit_kerja"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_kerja: {
        Row: {
          created_at: string
          id: string
          nama_unit_kerja: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama_unit_kerja: string
        }
        Update: {
          created_at?: string
          id?: string
          nama_unit_kerja?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      assessment_type: "asn_teladan" | "flexing" | "custom"
      criteria_input_type:
        | "number"
        | "boolean"
        | "text"
        | "select"
        | "file_upload"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assessment_type: ["asn_teladan", "flexing", "custom"],
      criteria_input_type: [
        "number",
        "boolean",
        "text",
        "select",
        "file_upload",
      ],
    },
  },
} as const
