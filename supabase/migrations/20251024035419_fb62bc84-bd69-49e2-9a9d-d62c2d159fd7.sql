-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin_pusat', 'admin_unit', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    unit_kerja_id UUID REFERENCES public.unit_kerja(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin pusat
CREATE OR REPLACE FUNCTION public.is_admin_pusat()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin_pusat'::app_role)
$$;

-- Function to check if user is admin unit
CREATE OR REPLACE FUNCTION public.is_admin_unit()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin_unit'::app_role)
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admin pusat can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin_pusat());

CREATE POLICY "Admin pusat can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin_pusat())
WITH CHECK (public.is_admin_pusat());

-- Update penilaian table policies to use new roles
DROP POLICY IF EXISTS "Super admin can verify all penilaian" ON public.penilaian;
DROP POLICY IF EXISTS "Super admin can view all penilaian" ON public.penilaian;

CREATE POLICY "Admin pusat can view all penilaian"
ON public.penilaian
FOR SELECT
USING (public.is_admin_pusat() OR public.is_admin_unit() OR auth.uid() = penilai_user_id);

CREATE POLICY "Admin pusat can verify all penilaian"
ON public.penilaian
FOR UPDATE
USING (public.is_admin_pusat() OR public.is_admin_unit() OR auth.uid() = penilai_user_id);

-- Grant super admin email the admin_pusat role automatically
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin_pusat'::app_role
FROM auth.users
WHERE email = 'hrmlavotas@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;