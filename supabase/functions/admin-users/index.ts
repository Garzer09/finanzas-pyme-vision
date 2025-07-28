import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          user_id: string
          role: 'admin' | 'user'
        }
      }
      user_profiles: {
        Row: {
          user_id: string
          company_name: string | null
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the user is an admin
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Check if user is admin using the service role client
    const supabaseAdmin = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    // Get all users with their profiles and roles using admin client
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      throw authError
    }

    // Get user profiles and roles
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, company_name')

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')

    // Combine the data
    const usersWithDetails = authUsers.users.map(authUser => {
      const profile = profiles?.find(p => p.user_id === authUser.id)
      const role = roles?.find(r => r.user_id === authUser.id)
      
      return {
        id: authUser.id,
        email: authUser.email,
        company_name: profile?.company_name || 'Sin empresa',
        role: role?.role || 'user',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at
      }
    })

    console.log(`Admin users fetched: ${usersWithDetails.length} users`)

    return new Response(
      JSON.stringify({ users: usersWithDetails }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in admin-users function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})