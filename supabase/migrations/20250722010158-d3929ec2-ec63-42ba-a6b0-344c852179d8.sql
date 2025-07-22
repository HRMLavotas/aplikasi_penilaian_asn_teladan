-- Add verification fields to the penilaian table
ALTER TABLE public.penilaian 
ADD COLUMN verification_status text CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
ADD COLUMN verification_label text CHECK (verification_label IN ('tidak_memenuhi_kriteria', 'memenuhi_kriteria', 'melebihi_kriteria')) DEFAULT NULL,
ADD COLUMN verification_notes text DEFAULT NULL,
ADD COLUMN verified_by uuid REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN verified_at timestamp with time zone DEFAULT NULL,
ADD COLUMN is_data_valid boolean DEFAULT true,
ADD COLUMN original_score numeric DEFAULT NULL;

-- Create index for better performance on verification queries
CREATE INDEX idx_penilaian_verification_status ON public.penilaian(verification_status);
CREATE INDEX idx_penilaian_verification_label ON public.penilaian(verification_label);

-- Update RLS policies to allow super admin to verify
CREATE POLICY "Super admin can verify all penilaian" 
ON public.penilaian 
FOR UPDATE 
USING (is_super_admin());