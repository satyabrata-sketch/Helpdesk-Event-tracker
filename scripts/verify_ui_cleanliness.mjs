import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9226;

async function checkCleanUi() {
  const tempDir = path.resolve('./.temp_browser_profile_clean');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempDir}`,
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1500,1050',
    'http://localhost:3000/?tab=events'
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
  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 2000));

  const result = await send('Runtime.evaluate', {
    expression: `(() => {
      const bodyText = document.body.innerText;
      
      const yearOptions = Array.from(document.querySelectorAll('select')).map(s => Array.from(s.options).map(o => o.value));
      const has2025Option = yearOptions.some(opts => opts.includes('2025'));

      const kpiContainers = Array.from(document.querySelectorAll('div')).filter(d => 
        d.className && typeof d.className === 'string' && d.className.includes('grid-cols-2') && d.className.includes('lg:grid-cols-8')
      );
      const kpis = kpiContainers[0] ? Array.from(kpiContainers[0].children).map(d => ({
        label: d.querySelector('span')?.innerText,
        value: d.querySelector('.text-xl')?.innerText
      })) : [];

      return {
        kpis,
        hasAuditMode: bodyText.includes('Audit Mode'),
        hasFilterVerified: bodyText.includes('Filter Verified'),
        hasFilterMismatch: bodyText.includes('Filter mismatch'),
        hasValidEventsTag: bodyText.includes('Valid Events: 2,015'),
        hasDataQuality: bodyText.includes('Excel Data Quality:'),
        hasDebugText: bodyText.includes('Debug:') && bodyText.includes('Aug-26 Big'),
        hasOctDecWarning: bodyText.includes('Oct-Dec data may be incomplete'),
        hasDoubleClickText: bodyText.includes('Double Click to View') || bodyText.includes('Double-click to view'),
        has2025Option: has2025Option
      };
    })()`,
    returnByValue: true
  });

  if (result.exceptionDetails) {
    console.error('Eval error:', result.exceptionDetails);
  } else {
    console.log('=== CLEAN UI AUDIT REPORT ===');
    console.log(JSON.stringify(result.result.value, null, 2));
  }

  ws.close();
  chromeProc.kill();
}

checkCleanUi().catch(err => {
  console.error(err);
  process.exit(1);
});
