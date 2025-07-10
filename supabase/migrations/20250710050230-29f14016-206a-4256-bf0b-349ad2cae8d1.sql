
-- Create table for unit kerja
CREATE TABLE public.unit_kerja (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_unit_kerja TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for pegawai
CREATE TABLE public.pegawai (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nip TEXT NOT NULL UNIQUE,
  jabatan TEXT NOT NULL,
  unit_kerja_id UUID REFERENCES public.unit_kerja(id) NOT NULL,
  status_jabatan TEXT NOT NULL CHECK (status_jabatan IN ('administrasi', 'fungsional')),
  bebas_temuan BOOLEAN NOT NULL DEFAULT false,
  tidak_hukuman_disiplin BOOLEAN NOT NULL DEFAULT false,
  tidak_pemeriksaan_disiplin BOOLEAN NOT NULL DEFAULT false,
  masa_kerja_tahun INTEGER NOT NULL DEFAULT 0,
  memiliki_inovasi BOOLEAN NOT NULL DEFAULT false,
  bukti_inovasi TEXT,
  memiliki_penghargaan BOOLEAN NOT NULL DEFAULT false,
  bukti_penghargaan TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for penilaian
CREATE TABLE public.penilaian (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pegawai_id UUID REFERENCES public.pegawai(id) ON DELETE CASCADE NOT NULL,
  penilai_user_id UUID REFERENCES auth.users(id) NOT NULL,
  tahun_penilaian INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  skp_2_tahun_terakhir_baik BOOLEAN NOT NULL DEFAULT false,
  skp_peningkatan_prestasi BOOLEAN NOT NULL DEFAULT false,
  kinerja_perilaku_score INTEGER NOT NULL CHECK (kinerja_perilaku_score >= 1 AND kinerja_perilaku_score <= 100),
  inovasi_dampak_score INTEGER NOT NULL CHECK (inovasi_dampak_score >= 1 AND inovasi_dampak_score <= 100),
  prestasi_score INTEGER NOT NULL CHECK (prestasi_score >= 1 AND prestasi_score <= 100),
  inspiratif_score INTEGER NOT NULL CHECK (inspiratif_score >= 1 AND inspiratif_score <= 100),
  komunikasi_score INTEGER NOT NULL CHECK (komunikasi_score >= 1 AND komunikasi_score <= 100),
  kerjasama_kolaborasi_score INTEGER NOT NULL CHECK (kerjasama_kolaborasi_score >= 1 AND kerjasama_kolaborasi_score <= 100),
  leadership_score INTEGER NOT NULL CHECK (leadership_score >= 1 AND leadership_score <= 100),
  rekam_jejak_score INTEGER NOT NULL CHECK (rekam_jejak_score >= 1 AND rekam_jejak_score <= 100),
  integritas_moralitas_score INTEGER NOT NULL CHECK (integritas_moralitas_score >= 1 AND integritas_moralitas_score <= 100),
  persentase_akhir NUMERIC(5,2),
  analisis_ai_pro TEXT,
  analisis_ai_kontra TEXT,
  analisis_ai_kelebihan TEXT,
  analisis_ai_kekurangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pegawai_id, penilai_user_id, tahun_penilaian)
);

-- Create table for user profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  nama_lengkap TEXT,
  unit_kerja_id UUID REFERENCES public.unit_kerja(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.unit_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pegawai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penilaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for unit_kerja (readable by all authenticated users)
CREATE POLICY "Users can view all unit kerja" ON public.unit_kerja FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert unit kerja" ON public.unit_kerja FOR INSERT TO authenticated WITH CHECK (true);

-- Create RLS policies for pegawai
CREATE POLICY "Users can view all pegawai" ON public.pegawai FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own pegawai" ON public.pegawai FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pegawai" ON public.pegawai FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pegawai" ON public.pegawai FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create RLS policies for penilaian
CREATE POLICY "Users can view all penilaian" ON public.penilaian FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own penilaian" ON public.penilaian FOR INSERT TO authenticated WITH CHECK (auth.uid() = penilai_user_id);
CREATE POLICY "Users can update their own penilaian" ON public.penilaian FOR UPDATE TO authenticated USING (auth.uid() = penilai_user_id);
CREATE POLICY "Users can delete their own penilaian" ON public.penilaian FOR DELETE TO authenticated USING (auth.uid() = penilai_user_id);

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, nama_lengkap)
  VALUES (new.id, new.raw_user_meta_data ->> 'username', new.raw_user_meta_data ->> 'nama_lengkap');
  RETURN new;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to calculate persentase_akhir
CREATE OR REPLACE FUNCTION public.calculate_persentase_akhir()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate weighted average (equal weights for now - can be adjusted)
  NEW.persentase_akhir := (
    NEW.kinerja_perilaku_score +
    NEW.inovasi_dampak_score +
    NEW.prestasi_score +
    NEW.inspiratif_score +
    NEW.komunikasi_score +
    NEW.kerjasama_kolaborasi_score +
    NEW.leadership_score +
    NEW.rekam_jejak_score +
    NEW.integritas_moralitas_score
  ) / 9.0;
  
  -- Add bonus for SKP criteria (max 10 points bonus)
  IF NEW.skp_2_tahun_terakhir_baik THEN
    NEW.persentase_akhir := NEW.persentase_akhir + 5;
  END IF;
  
  IF NEW.skp_peningkatan_prestasi THEN
    NEW.persentase_akhir := NEW.persentase_akhir + 5;
  END IF;
  
  -- Ensure it doesn't exceed 100
  IF NEW.persentase_akhir > 100 THEN
    NEW.persentase_akhir := 100;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate persentase_akhir
CREATE TRIGGER calculate_persentase_before_upsert
  BEFORE INSERT OR UPDATE ON public.penilaian
  FOR EACH ROW EXECUTE PROCEDURE public.calculate_persentase_akhir();

-- Insert sample unit kerja
INSERT INTO public.unit_kerja (nama_unit_kerja) VALUES 
('Direktorat Jenderal Pembinaan Pelatihan Vokasi dan Produktivitas'),
('Direktorat Jenderal Pembinaan Pengawasan Ketenagakerjaan'),
('Direktorat Jenderal Pembinaan Hubungan Industrial'),
('Sekretariat Jenderal'),
('Inspektorat Jenderal'),
('Badan Pengembangan Sumber Daya Manusia');
