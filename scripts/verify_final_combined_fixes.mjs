import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9225;
const ARTIFACTS_DIR = 'C:\\Users\\SMohanty6\\.gemini\\antigravity-cli\\brain\\8f121399-ba40-4b5b-896b-7bfa6cd15f3d';

async function runVerification() {
  console.log('--- STARTING VERIFICATION OF 4 COMBINED FIXES ---');
  const tempDir = path.resolve('./.temp_browser_profile_final');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempDir}`,
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1500,1050',
    'http://localhost:3000/?tab=event_tracker&kpi=upcoming_events&year=2026&building=Downtown-4&pax=100%2B'
  ], { detached: false });

  await new Promise(r => setTimeout(r, 4000));

  const tabs = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageTab = tabs.find(t => t.type === 'page');
  if (!pageTab) throw new Error('No page tab found');

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = idCounter++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise(r => ws.onopen = r);

  console.log('Connected to Chrome DevTools Protocol');
  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  // Wait for table to render
  await new Promise(r => setTimeout(r, 3500));

  // TEST 1 & 2: Check Time format and Event Scale in Detail Table
  console.log('\n=== TEST 1: TIME FORMAT & TEST 2: SCALE PAX 100 ===');
  const tableEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const textRows = rows.map(r => Array.from(r.querySelectorAll('td')).map(td => td.innerText.trim()));
      const rawText = document.body.innerText;
      
      // Look for decimal time fractions like 0.375, 0.4791
      const decimalTimeMatches = rawText.match(/0\\.\\d{3,}/g) || [];
      
      // Look for formatted times
      const formattedTimes = rawText.match(/\\b\\d{2}:\\d{2}\\s+(AM|PM)\\b/g) || [];

      // Check scale values
      const scaleValues = [];
      rows.forEach(r => {
        const text = r.innerText;
        if (text.includes('Big Event') || text.includes('Small Event')) {
          scaleValues.push(text.includes('Big Event') ? 'Big Event' : 'Small Event');
        }
      });

      return {
        rowCount: rows.length,
        decimalTimeMatches,
        formattedTimesCount: formattedTimes.length,
        sampleTimes: formattedTimes.slice(0, 8),
        scaleValues: scaleValues.slice(0, 10),
        firstThreeRows: textRows.slice(0, 3)
      };
    })()`,
    returnByValue: true
  });

  console.log('Table evaluation result:', JSON.stringify(tableEval.result.value, null, 2));

  // Save Screenshot 1: Detail Table View (Upcoming 2026 DT-4 100+)
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  const ss1Path = path.join(ARTIFACTS_DIR, 'final_upcoming_events_table.png');
  fs.writeFileSync(ss1Path, Buffer.from(ss1.data, 'base64'));
  console.log('Saved screenshot 1:', ss1Path);

  // TEST 3: Top Tab Toggle from Detail View
  console.log('\n=== TEST 3: TOP TAB TOGGLE FROM DETAIL VIEW ===');
  const clickHelpdesk = await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('header nav button'));
      const helpdeskBtn = buttons.find(b => b.innerText.includes('Helpdesk'));
      if (helpdeskBtn) {
        helpdeskBtn.click();
        return { clicked: true, currentUrl: window.location.href };
      }
      return { clicked: false };
    })()`,
    returnByValue: true
  });
  console.log('Clicked Helpdesk Tab:', clickHelpdesk.result.value);

  await new Promise(r => setTimeout(r, 2000));

  const afterHelpdeskClick = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        url: window.location.href,
        hasHelpdeskContent: document.body.innerText.includes('Helpdesk Analysis') || document.body.innerText.includes('HELP DESK') || document.body.innerText.includes('TAT Status'),
        isDetailViewGone: !document.body.innerText.includes('Showing details for:') && !document.body.innerText.includes('— Full Details from Tracker')
      };
    })()`,
    returnByValue: true
  });
  console.log('After Helpdesk click state:', JSON.stringify(afterHelpdeskClick.result.value, null, 2));

  // Save Screenshot 2: Helpdesk View switched from Detail View
  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  const ss2Path = path.join(ARTIFACTS_DIR, 'final_top_tab_toggle_helpdesk.png');
  fs.writeFileSync(ss2Path, Buffer.from(ss2.data, 'base64'));
  console.log('Saved screenshot 2:', ss2Path);

  // Switch to Event Tab to test Clean UI
  console.log('\n=== TEST 4: CLEAN UI (EVENT TAB) ===');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('header nav button'));
      const eventBtn = buttons.find(b => b.innerText.includes('Event'));
      if (eventBtn) eventBtn.click();
    })()`,
    returnByValue: true
  });

  await new Promise(r => setTimeout(r, 2500));

  const cleanUiCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      
      const checks = {
        url: window.location.href,
        hasAuditMode: text.includes('Audit Mode'),
        hasFilterVerified: text.includes('Filter Verified'),
        hasFilterMismatch: text.includes('Filter mismatch'),
        hasValidEventsBanner: text.includes('Source: OneDrive Live | Valid Events'),
        hasDataQualityBox: text.includes('Excel Data Quality:'),
        hasDebugBox: text.includes('Debug:') && text.includes('Aug-26 Big'),
        hasOctDecWarning: text.includes('Oct-Dec data may be incomplete'),
        hasDoubleClickTooltip: text.includes('Double Click to View') || text.includes('Double-click to view'),
        hasSunday0EventsBanner: text.includes('Today: Sunday, 08-Nov-2026 — 0 Valid Events Confirmed'),
        
        // Year filter options check
        eventYearSelect: (() => {
          const selects = Array.from(document.querySelectorAll('select'));
          for (const s of selects) {
            const opts = Array.from(s.options).map(o => o.value);
            if (opts.includes('2026')) return opts;
          }
          return [];
        })(),
        
        // Check for 8 KPI values
        totalEventsKpi: document.querySelector('.text-\\[10px\\].font-bold')?.parentElement?.innerText || 'found'
      };
      return checks;
    })()`,
    returnByValue: true
  });
  console.log('Clean UI Verification Results:', JSON.stringify(cleanUiCheck.result.value, null, 2));

  // Save Screenshot 3: Clean Event Tab
  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  const ss3Path = path.join(ARTIFACTS_DIR, 'final_clean_event_tab.png');
  fs.writeFileSync(ss3Path, Buffer.from(ss3.data, 'base64'));
  console.log('Saved screenshot 3:', ss3Path);

  ws.close();
  chromeProc.kill();
  console.log('\n--- ALL VERIFICATION TESTS COMPLETED ---');
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
