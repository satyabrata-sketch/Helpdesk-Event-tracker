// ==============================================================================
// SUPABASE CLIENT & DATA ACCESS LAYER
// Updated to support Supabase Publishable Key (sb_publishable_...) as Anon Key
// ==============================================================================
import { createClient } from '@supabase/supabase-js'

// Clean and sanitize URL and keys (removes any accidental brackets or whitespace)
const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabaseUrl = rawUrl.replace(/[\[\]"']/g, '').trim()
export const supabaseAnonKey = rawKey.replace(/[\[\]"']/g, '').trim()

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('your-project')
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null

console.log('[Supabase] Initialized status:', {
  configured: isSupabaseConfigured,
  url: supabaseUrl ? supabaseUrl.slice(0, 30) + '...' : 'none',
  keyType: supabaseAnonKey.startsWith('sb_publishable_') ? 'Publishable Key (New Format)' : 'Standard Key'
})

// Quick connection test
export async function testSupabaseConnection() {
  if (!supabase) return { connected: false, message: 'Supabase client not configured' }
  try {
    const { data, error } = await supabase.from('tracker_configs').select('count', { count: 'exact', head: true })
    if (error) throw error
    return { connected: true, message: 'Connected successfully' }
  } catch (err) {
    return { connected: false, error: err.message }
  }
}

// Fetch Tracker Configurations
export async function getTrackerConfigs() {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('tracker_configs')
      .select('*')
      .order('id')
    if (error) throw error
    return data
  } catch (err) {
    console.warn('Error fetching tracker_configs from Supabase:', err.message)
    return null
  }
}

// Update Tracker Share URL (Admin Only)
export async function updateTrackerConfig(id, updates) {
  if (!supabase) return { error: new Error('Supabase not configured') }
  try {
    const { data, error } = await supabase
      .from('tracker_configs')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  } catch (err) {
    return { error: err }
  }
}

// Fetch Helpdesk Tickets
export async function getHelpdeskTickets(limit = 1000) {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('helpdesk_tickets')
      .select('*')
      .order('id', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  } catch (err) {
    console.warn('Error fetching helpdesk_tickets from Supabase:', err.message)
    return null
  }
}

// Fetch Event Operations
export async function getEventOperations(limit = 1000) {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('event_operations')
      .select('*')
      .order('id', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data
  } catch (err) {
    console.warn('Error fetching event_operations from Supabase:', err.message)
    return null
  }
}

// Fetch Multi-Sheet Dynamic Rows
export async function getSheetRows(trackerId, sheetName, limit = 1000) {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('tracker_rows')
      .select('row_index, data')
      .eq('tracker_id', trackerId)
      .eq('sheet_name', sheetName)
      .order('row_index', { ascending: true })
      .limit(limit)
    if (error) throw error
    return data.map(r => r.data)
  } catch (err) {
    console.warn('Error fetching tracker_rows:', err.message)
    return null
  }
}

// Fetch Sheet Metadata (Column order, count)
export async function getSheetMetadata(trackerId) {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('tracker_sheets')
      .select('*')
      .eq('tracker_id', trackerId)
  } catch (err) {
    console.warn('Error fetching tracker_sheets:', err.message)
    return null
  }
}

// Trigger Manual Sync via Edge Function
export async function triggerOneDriveSync() {
  if (!supabase) {
    return { 
      success: false, 
      message: 'Supabase credentials not configured yet. Using local live data mode.' 
    }
  }
  try {
    const { data, error } = await supabase.functions.invoke('sync-onedrive', {
      body: { trigger: 'manual_ui', timestamp: new Date().toISOString() }
    })
    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Edge Function sync failed:', err)
    return { success: false, error: err.message }
  }
}

// Auth helpers
export async function signInAdmin(email, password) {
  if (!supabase) return { error: new Error('Supabase not configured') }
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signOutAdmin() {
  if (!supabase) return { error: null }
  return await supabase.auth.signOut()
}

export async function getCurrentUser() {
  if (!supabase) return null
  try {
    const { data } = await supabase.auth.getUser()
    return data?.user || null
  } catch (_e) {
    return null
  }
}
