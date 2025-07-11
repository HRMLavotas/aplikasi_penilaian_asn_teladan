-- Create activities table for tracking user actions and system events
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    description TEXT NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX(user_id),
    INDEX(created_at),
    INDEX(action_type),
    INDEX(entity_type)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies for activities table
-- Users can view their own activities and all activities if they are admin
CREATE POLICY "Users can view activities" ON public.activities
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'hrmlavotas@gmail.com'
        )
    );

-- Only authenticated users can insert activities
CREATE POLICY "Authenticated users can insert activities" ON public.activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add comment for documentation
COMMENT ON TABLE public.activities IS 'Tracks user activities and system events for audit trail';
COMMENT ON COLUMN public.activities.action_type IS 'Type of action performed (create, update, delete, view, login, etc.)';
COMMENT ON COLUMN public.activities.entity_type IS 'Type of entity affected (pegawai, penilaian, user, etc.)';
COMMENT ON COLUMN public.activities.entity_id IS 'ID of the specific entity that was affected';
COMMENT ON COLUMN public.activities.description IS 'Human-readable description of the activity';
COMMENT ON COLUMN public.activities.details IS 'Additional metadata about the activity in JSON format';

-- Insert some sample activities for testing
INSERT INTO public.activities (user_id, action_type, entity_type, entity_id, description, details) VALUES
(auth.uid(), 'login', 'user', auth.uid(), 'User logged into the system', '{"login_method": "email_password"}'),
(auth.uid(), 'view', 'dashboard', null, 'User viewed dashboard', '{"page": "dashboard"}');
