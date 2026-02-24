import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials
const supabaseUrl = 'https://chhqwrladvinygiciyvc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaHF3cmxhZHZpbnlnaWNpeXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTIyNTAsImV4cCI6MjA4NjI4ODI1MH0.ZwZQd3dh7nWFtGeGewEUtxCUi2aFZPlGYveANrSY3yg'

console.log('[Supabase] Initializing with URL:', supabaseUrl)
console.log('[Supabase] Key present:', !!supabaseAnonKey)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, 
    autoRefreshToken: true
  }
})

export const isSupabaseConfigured = true

// Test function
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('cholera_reports')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('[Supabase] Connection test failed:', error)
      return { success: false, error: error.message }
    }
    
    console.log('[Supabase] ✅ Connected successfully!')
    return { success: true, message: 'Connected to Supabase!' }
  } catch (err) {
    console.error('[Supabase] Connection error:', err)
    return { success: false, error: err.message }
  }
}