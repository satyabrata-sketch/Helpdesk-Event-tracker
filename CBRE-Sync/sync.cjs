global.WebSocket = require('ws');
require('dotenv').config();
const { syncHelpdeskFromExcel } = require('../scripts/helpdeskSync.cjs');
const fs = require('fs');

const HELP_PATH = process.env.HELP_PATH || 'C:/Users/SMohanty6/OneDrive - CBRE, Inc/Desktop/apps/Dashboard/Helpdesk & Event/CBRE-Sync/HELP DESK TRACKER FY 25-26 - Master.xlsx';

async function sync() {
  try {
    console.log('[CBRE-Sync] Triggering Helpdesk sync from:', HELP_PATH);
    const result = await syncHelpdeskFromExcel({ customFilePath: HELP_PATH });
    console.log('[CBRE-Sync] SUCCESS:', result);
  } catch (e) {
    console.error('[CBRE-Sync] ERROR:', e.message);
  }
}

sync();

if (fs.existsSync(HELP_PATH)) {
  fs.watchFile(HELP_PATH, { interval: 2000 }, sync);
  console.log('[CBRE-Sync] Watching Helpdesk file for changes...');
}
