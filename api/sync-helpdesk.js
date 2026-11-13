import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rtegucaglwrvhharkxet.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const opts = req.method === 'POST' ? (req.body || {}) : (req.query || {});

  // 1. Check if local Excel file exists to run full sync
  let syncResult = null;
  try {
    const { syncHelpdeskFromExcel, resolveHelpdeskFilePath } = require('../scripts/helpdeskSync.cjs');
    const localFile = resolveHelpdeskFilePath(opts.filePath);
    if (localFile && fs.existsSync(localFile)) {
      syncResult = await syncHelpdeskFromExcel(opts);
    }
  } catch (err) {
    console.warn('[API /api/sync-helpdesk] Local sync skipped/failed:', err.message);
  }

  // 2. Fetch config & counts from Supabase
  try {
    const { data: config } = await supabase
      .from('tracker_configs')
      .select('*')
      .eq('id', 'helpdesk_tracker')
      .single();

    let tickets = null;
    if (opts.getTickets === 'true' || opts.all === 'true') {
      let all = [];
      let page = 0;
      while (true) {
        const { data, error } = await supabase
          .from('helpdesk')
          .select('*')
          .range(page * 1000, (page + 1) * 1000 - 1);
        if (error || !data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < 1000) break;
        page++;
      }
      tickets = all;
    }

    return res.status(200).json({
      success: true,
      endpoint: '/api/sync-helpdesk',
      syncResult,
      trackerConfig: config,
      tickets: tickets || undefined,
      lastSyncedAt: config?.last_synced_at || new Date().toISOString()
    });
  } catch (err) {
    console.error('[API /api/sync-helpdesk] Handler error:', err);
    return res.status(500).json({
      success: false,
      endpoint: '/api/sync-helpdesk',
      error: err.message
    });
  }
}
