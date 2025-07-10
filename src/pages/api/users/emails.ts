import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize the Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user's JWT from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify the JWT to ensure the user is authenticated
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if the user is a super admin
    const isSuperAdmin = user.email === 'hrmlavotas@gmail.com';
    
    if (!isSuperAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Get all users (this requires service role key)
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }

    // Only return necessary user data
    const userEmails = users.users.map(u => ({
      id: u.id,
      email: u.email
    }));

    return res.status(200).json(userEmails);
  } catch (error) {
    console.error('Error in /api/users/emails:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
