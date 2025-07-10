-- Create or replace function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'hrmlavotas@gmail.com'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Update RLS policies for pegawai table
DROP POLICY IF EXISTS "Users can view all pegawai" ON public.pegawai;
DROP POLICY IF EXISTS "Users can insert their own pegawai" ON public.pegawai;
DROP POLICY IF EXISTS "Users can update their own pegawai" ON public.pegawai;
DROP POLICY IF EXISTS "Users can delete their own pegawai" ON public.pegawai;

-- Create new policies for pegawai
CREATE POLICY "Super admin can view all pegawai" 
ON public.pegawai 
FOR SELECT 
TO authenticated 
USING (public.is_super_admin() OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own pegawai" 
ON public.pegawai 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pegawai" 
ON public.pegawai 
FOR UPDATE 
TO authenticated 
USING (public.is_super_admin() OR auth.uid() = user_id);

CREATE POLICY "Users can delete their own pegawai" 
ON public.pegawai 
FOR DELETE 
TO authenticated 
USING (public.is_super_admin() OR auth.uid() = user_id);

-- Update RLS policies for penilaian table
DROP POLICY IF EXISTS "Users can view all penilaian" ON public.penilaian;
DROP POLICY IF EXISTS "Users can insert their own penilaian" ON public.penilaian;
DROP POLICY IF EXISTS "Users can update their own penilaian" ON public.penilaian;
DROP POLICY IF EXISTS "Users can delete their own penilaian" ON public.penilaian;

-- Create new policies for penilaian
CREATE POLICY "Super admin can view all penilaian" 
ON public.penilaian 
FOR SELECT 
TO authenticated 
USING (public.is_super_admin() OR auth.uid() = penilai_user_id);

CREATE POLICY "Users can insert their own penilaian" 
ON public.penilaian 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = penilai_user_id);

CREATE POLICY "Users can update their own penilaian" 
ON public.penilaian 
FOR UPDATE 
TO authenticated 
USING (public.is_super_admin() OR auth.uid() = penilai_user_id);

CREATE POLICY "Users can delete their own penilaian" 
ON public.penilaian 
FOR DELETE 
TO authenticated 
USING (public.is_super_admin() OR auth.uid() = penilai_user_id);
