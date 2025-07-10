export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)";
  };
  public: {
    Tables: {
      pegawai: {
        Row: {
          bebas_temuan: boolean;
          bukti_inovasi: string | null;
          bukti_penghargaan: string | null;
          created_at: string;
          id: string;
          jabatan: string;
          masa_kerja_tahun: number;
          memiliki_inovasi: boolean;
          memiliki_penghargaan: boolean;
          nama: string;
          nip: string;
          status_jabatan: string;
          tidak_hukuman_disiplin: boolean;
          tidak_pemeriksaan_disiplin: boolean;
          unit_kerja_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bebas_temuan?: boolean;
          bukti_inovasi?: string | null;
          bukti_penghargaan?: string | null;
          created_at?: string;
          id?: string;
          jabatan: string;
          masa_kerja_tahun?: number;
          memiliki_inovasi?: boolean;
          memiliki_penghargaan?: boolean;
          nama: string;
          nip: string;
          status_jabatan: string;
          tidak_hukuman_disiplin?: boolean;
          tidak_pemeriksaan_disiplin?: boolean;
          unit_kerja_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bebas_temuan?: boolean;
          bukti_inovasi?: string | null;
          bukti_penghargaan?: string | null;
          created_at?: string;
          id?: string;
          jabatan?: string;
          masa_kerja_tahun?: number;
          memiliki_inovasi?: boolean;
          memiliki_penghargaan?: boolean;
          nama?: string;
          nip?: string;
          status_jabatan?: string;
          tidak_hukuman_disiplin?: boolean;
          tidak_pemeriksaan_disiplin?: boolean;
          unit_kerja_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pegawai_unit_kerja_id_fkey";
            columns: ["unit_kerja_id"];
            isOneToOne: false;
            referencedRelation: "unit_kerja";
            referencedColumns: ["id"];
          },
        ];
      };
      penilaian: {
        Row: {
          adaptif_score: number;
          akuntabel_score: number;
          analisis_ai_kekurangan: string | null;
          analisis_ai_kelebihan: string | null;
          analisis_ai_kontra: string | null;
          analisis_ai_pro: string | null;
          bebas_temuan: boolean;
          berorientasi_pelayanan_score: number;
          bukti_inovasi: string | null;
          bukti_penghargaan: string | null;
          created_at: string;
          harmonis_score: number;
          id: string;
          kolaboratif_score: number;
          kompeten_score: number;
          loyal_score: number;
          memiliki_inovasi: boolean;
          memiliki_penghargaan: boolean;
          pegawai_id: string;
          penilai_user_id: string;
          persentase_akhir: number | null;
          skp_2_tahun_terakhir_baik: boolean;
          skp_peningkatan_prestasi: boolean;
          tahun_penilaian: number;
          tidak_hukuman_disiplin: boolean;
          tidak_pemeriksaan_disiplin: boolean;
          updated_at: string;
        };
        Insert: {
          adaptif_score?: number;
          akuntabel_score?: number;
          analisis_ai_kekurangan?: string | null;
          analisis_ai_kelebihan?: string | null;
          analisis_ai_kontra?: string | null;
          analisis_ai_pro?: string | null;
          bebas_temuan?: boolean;
          berorientasi_pelayanan_score?: number;
          bukti_inovasi?: string | null;
          bukti_penghargaan?: string | null;
          created_at?: string;
          harmonis_score?: number;
          id?: string;
          kolaboratif_score?: number;
          kompeten_score?: number;
          loyal_score?: number;
          memiliki_inovasi?: boolean;
          memiliki_penghargaan?: boolean;
          pegawai_id: string;
          penilai_user_id: string;
          persentase_akhir?: number | null;
          skp_2_tahun_terakhir_baik?: boolean;
          skp_peningkatan_prestasi?: boolean;
          tahun_penilaian?: number;
          tidak_hukuman_disiplin?: boolean;
          tidak_pemeriksaan_disiplin?: boolean;
          updated_at?: string;
        };
        Update: {
          adaptif_score?: number;
          akuntabel_score?: number;
          analisis_ai_kekurangan?: string | null;
          analisis_ai_kelebihan?: string | null;
          analisis_ai_kontra?: string | null;
          analisis_ai_pro?: string | null;
          bebas_temuan?: boolean;
          berorientasi_pelayanan_score?: number;
          bukti_inovasi?: string | null;
          bukti_penghargaan?: string | null;
          created_at?: string;
          harmonis_score?: number;
          id?: string;
          kolaboratif_score?: number;
          kompeten_score?: number;
          loyal_score?: number;
          memiliki_inovasi?: boolean;
          memiliki_penghargaan?: boolean;
          pegawai_id?: string;
          penilai_user_id?: string;
          persentase_akhir?: number | null;
          skp_2_tahun_terakhir_baik?: boolean;
          skp_peningkatan_prestasi?: boolean;
          tahun_penilaian?: number;
          tidak_hukuman_disiplin?: boolean;
          tidak_pemeriksaan_disiplin?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "penilaian_pegawai_id_fkey";
            columns: ["pegawai_id"];
            isOneToOne: false;
            referencedRelation: "pegawai";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          nama_lengkap: string | null;
          unit_kerja_id: string | null;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          nama_lengkap?: string | null;
          unit_kerja_id?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          nama_lengkap?: string | null;
          unit_kerja_id?: string | null;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_unit_kerja_id_fkey";
            columns: ["unit_kerja_id"];
            isOneToOne: false;
            referencedRelation: "unit_kerja";
            referencedColumns: ["id"];
          },
        ];
      };
      unit_kerja: {
        Row: {
          created_at: string;
          id: string;
          nama_unit_kerja: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          nama_unit_kerja: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          nama_unit_kerja?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
