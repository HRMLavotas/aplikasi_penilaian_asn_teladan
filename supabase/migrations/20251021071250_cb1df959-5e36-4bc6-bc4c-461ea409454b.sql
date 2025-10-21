-- Create enum for assessment types
CREATE TYPE assessment_type AS ENUM ('asn_teladan', 'flexing', 'custom');

-- Create enum for criteria input types
CREATE TYPE criteria_input_type AS ENUM ('number', 'boolean', 'text', 'select', 'file_upload');

-- Table: assessment_templates
CREATE TABLE public.assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_assessment TEXT NOT NULL,
  deskripsi TEXT,
  assessment_type assessment_type NOT NULL DEFAULT 'custom',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  formula_perhitungan TEXT, -- Formula untuk kalkulasi skor akhir
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: assessment_criteria (kriteria penilaian per template)
CREATE TABLE public.assessment_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_template_id UUID NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  nama_kriteria TEXT NOT NULL,
  kode_kriteria TEXT NOT NULL, -- untuk mapping dalam formula
  deskripsi TEXT,
  tipe_input criteria_input_type NOT NULL DEFAULT 'number',
  options JSONB, -- untuk dropdown/select options
  bobot INTEGER DEFAULT 0, -- bobot dalam perhitungan
  min_value NUMERIC,
  max_value NUMERIC,
  is_required BOOLEAN NOT NULL DEFAULT true,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: penilaian_detail (detail penilaian per kriteria)
CREATE TABLE public.penilaian_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penilaian_id UUID NOT NULL REFERENCES public.penilaian(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES public.assessment_criteria(id),
  nilai JSONB NOT NULL, -- flexible storage untuk berbagai tipe input
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(penilaian_id, criteria_id)
);

-- Add assessment_template_id to penilaian table
ALTER TABLE public.penilaian 
ADD COLUMN assessment_template_id UUID REFERENCES public.assessment_templates(id);

-- Create default ASN Teladan template
INSERT INTO public.assessment_templates (
  id,
  nama_assessment,
  deskripsi,
  assessment_type,
  is_active,
  formula_perhitungan
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ASN Teladan',
  'Penilaian untuk pemilihan ASN Teladan berdasarkan kriteria kinerja, perilaku, dan prestasi',
  'asn_teladan',
  true,
  'COMPLEX' -- marker untuk formula khusus ASN Teladan
);

-- Update existing penilaian to link to ASN Teladan template
UPDATE public.penilaian 
SET assessment_template_id = '00000000-0000-0000-0000-000000000001'
WHERE assessment_template_id IS NULL;

-- Make assessment_template_id required after migration
ALTER TABLE public.penilaian 
ALTER COLUMN assessment_template_id SET NOT NULL;

-- Enable RLS
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penilaian_detail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessment_templates
CREATE POLICY "Everyone can view active templates"
ON public.assessment_templates FOR SELECT
USING (is_active = true OR is_super_admin());

CREATE POLICY "Only super admin can manage templates"
ON public.assessment_templates FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- RLS Policies for assessment_criteria
CREATE POLICY "Everyone can view criteria of active templates"
ON public.assessment_criteria FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assessment_templates
    WHERE id = assessment_template_id
    AND (is_active = true OR is_super_admin())
  )
);

CREATE POLICY "Only super admin can manage criteria"
ON public.assessment_criteria FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- RLS Policies for penilaian_detail
CREATE POLICY "Users can view their own penilaian details"
ON public.penilaian_detail FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.penilaian
    WHERE id = penilaian_id
    AND (penilai_user_id = auth.uid() OR is_super_admin())
  )
);

CREATE POLICY "Users can insert their own penilaian details"
ON public.penilaian_detail FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.penilaian
    WHERE id = penilaian_id
    AND penilai_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own penilaian details"
ON public.penilaian_detail FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.penilaian
    WHERE id = penilaian_id
    AND (penilai_user_id = auth.uid() OR is_super_admin())
  )
);

CREATE POLICY "Users can delete their own penilaian details"
ON public.penilaian_detail FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.penilaian
    WHERE id = penilaian_id
    AND (penilai_user_id = auth.uid() OR is_super_admin())
  )
);

-- Create indexes for performance
CREATE INDEX idx_assessment_criteria_template ON public.assessment_criteria(assessment_template_id);
CREATE INDEX idx_penilaian_detail_penilaian ON public.penilaian_detail(penilaian_id);
CREATE INDEX idx_penilaian_detail_criteria ON public.penilaian_detail(criteria_id);
CREATE INDEX idx_penilaian_template ON public.penilaian(assessment_template_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_assessment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_assessment_templates_updated_at
BEFORE UPDATE ON public.assessment_templates
FOR EACH ROW EXECUTE FUNCTION public.update_assessment_updated_at();

CREATE TRIGGER update_penilaian_detail_updated_at
BEFORE UPDATE ON public.penilaian_detail
FOR EACH ROW EXECUTE FUNCTION public.update_assessment_updated_at();