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

// Fetch Helpdesk Tickets from Supabase public.helpdesk (All 10,068+ rows with range pagination)
export async function getHelpdeskTickets() {
  if (supabase) {
    try {
      let allRows = []
      let page = 0
      const pageSize = 1000
      while (true) {
        const { data, error } = await supabase
          .from('helpdesk')
          .select('*')
          .range(page * pageSize, (page + 1) * pageSize - 1)
        if (error) throw error
        if (!data || data.length === 0) break
        allRows = allRows.concat(data)
        if (data.length < pageSize) break
        page++
      }

      if (allRows.length > 0) {
        return allRows.map((t) => {
          const st = String(t.status || t.raw?.['Status / WIP'] || t.raw?.['Status'] || '').trim()
          return {
            ...t.raw,
            ...t,
            'Sr no.': t.sr_no || t.raw?.['Sr no.'] || String(t.id),
            'Sr No.': t.sr_no || t.raw?.['Sr No.'] || String(t.id),
            'Status / WIP': st,
            'Status': st,
            'status': st,
            'Site': t.site || t.raw?.['Site'] || '',
            'Zone': t.zone || t.raw?.['Zone'] || '',
            'Location': t.location || t.raw?.['Location'] || '',
            'Month': t.month || t.raw?.['Month'] || '',
            'Date': t.date || t.raw?.['Date'] || '',
            'Report Time': t.report_time || t.raw?.['Report Time'] || '',
            'Request category': t.request_category || t.raw?.['Request category'] || '',
            'Category': t.request_category || t.raw?.['Category'] || '',
            'Employee Name': t.employee_name || t.raw?.['Employee Name'] || '',
            'Request Via': t.request_via || t.raw?.['Request Via'] || '',
            'Discription': t.description || t.raw?.['Discription'] || '',
            'Description': t.description || t.raw?.['Description'] || '',
            'Date close': t.date_close || t.raw?.['Date close'] || '',
            'Action taken': t.action_taken || t.raw?.['Action taken'] || '',
            'Resolved time': t.resolved_time || t.raw?.['Resolved time'] || '',
            'Call type': t.call_type || t.raw?.['Call type'] || '',
            'Request from': t.request_from || t.raw?.['Request from'] || '',
            'Defined TAT (Hrs)': t.defined_tat || t.raw?.['Defined TAT (Hrs)'] || '',
            'Remark': t.remark || t.raw?.['Remark'] || '',
            'Closure Duration': t.closure_duration || t.raw?.['Closure Duration'] || '',
            'Closure Time (Hrs)': t.closure_time || t.raw?.['Closure Time (Hrs)'] || '',
            'TAT Status': t.tat_status || t.raw?.['TAT Status'] || ''
          }
        })
      }
    } catch (err) {
      console.warn('Error fetching helpdesk tickets from Supabase client:', err.message)
    }
  }

  // Fallback to /api/sync-helpdesk endpoint
  try {
    const res = await fetch('/api/sync-helpdesk?getTickets=true')
    if (res.ok) {
      const json = await res.json()
      if (json.tickets && json.tickets.length > 0) {
        return json.tickets.map((t) => {
          const st = String(t.status || t.raw?.['Status / WIP'] || t.raw?.['Status'] || '').trim()
          return {
            ...t.raw,
            ...t,
            'Sr no.': t.sr_no || t.raw?.['Sr no.'] || String(t.id),
            'Sr No.': t.sr_no || t.raw?.['Sr No.'] || String(t.id),
            'Status / WIP': st,
            'Status': st,
            'status': st,
            'Site': t.site || t.raw?.['Site'] || '',
            'Zone': t.zone || t.raw?.['Zone'] || '',
            'Location': t.location || t.raw?.['Location'] || '',
            'Month': t.month || t.raw?.['Month'] || '',
            'Date': t.date || t.raw?.['Date'] || '',
            'Report Time': t.report_time || t.raw?.['Report Time'] || '',
            'Request category': t.request_category || t.raw?.['Request category'] || '',
            'Category': t.request_category || t.raw?.['Category'] || '',
            'Employee Name': t.employee_name || t.raw?.['Employee Name'] || '',
            'Request Via': t.request_via || t.raw?.['Request Via'] || '',
            'Discription': t.description || t.raw?.['Discription'] || '',
            'Description': t.description || t.raw?.['Description'] || '',
            'Date close': t.date_close || t.raw?.['Date close'] || '',
            'Action taken': t.action_taken || t.raw?.['Action taken'] || '',
            'Resolved time': t.resolved_time || t.raw?.['Resolved time'] || '',
            'Call type': t.call_type || t.raw?.['Call type'] || '',
            'Request from': t.request_from || t.raw?.['Request from'] || '',
            'Defined TAT (Hrs)': t.defined_tat || t.raw?.['Defined TAT (Hrs)'] || '',
            'Remark': t.remark || t.raw?.['Remark'] || '',
            'Closure Duration': t.closure_duration || t.raw?.['Closure Duration'] || '',
            'Closure Time (Hrs)': t.closure_time || t.raw?.['Closure Time (Hrs)'] || '',
            'TAT Status': t.tat_status || t.raw?.['TAT Status'] || ''
          }
        })
      }
    }
  } catch (_e) {}

  return null
}

// Trigger Manual Helpdesk Sync
export async function triggerHelpdeskSync(options = {}) {
  try {
    const res = await fetch('/api/sync-helpdesk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    })
    if (!res.ok) {
      throw new Error(`Helpdesk sync API returned HTTP ${res.status}`)
    }
    return await res.json()
  } catch (err) {
    console.error('Helpdesk sync invocation failed:', err)
    throw err
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
