import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;

async function run() {
  console.log('Launching Chrome...');
  const tempDir = path.resolve('./.temp_browser_profile');
  const edgeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempDir}`,
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1400,900',
    'http://localhost:3000'
  ], { detached: false });

  await new Promise(r => setTimeout(r, 3000));

  const tabs = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageTab = tabs.find(t => t.type === 'page' && t.url.includes('localhost:3000'));
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  });

  await new Promise((resolve) => {
    if (ws.readyState === WebSocket.OPEN) resolve();
    else ws.addEventListener('open', resolve);
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  console.log('Waiting for React app to render...');
  await new Promise(r => setTimeout(r, 3000));

  // Switch to Event tab
  console.log('Switching to Event Tab...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Event');
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  // Set Filters: Month = Jul-26, Building = Downtown-3, Pax = 100+ (Townhall)
  console.log('Setting Filters: Downtown-3 + 100+ (Townhall) + Jul-26...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const selects = Array.from(document.querySelectorAll('select'));
        const siteSelect = selects.find(s => Array.from(s.options).some(o => o.value === 'Downtown-3'));
        if (siteSelect) {
          siteSelect.value = 'Downtown-3';
          siteSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const paxSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('100+')));
        if (paxSelect) {
          const opt = Array.from(paxSelect.options).find(o => o.text.includes('100+'));
          paxSelect.value = opt.value;
          paxSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const monthDropdownBtn = Array.from(document.querySelectorAll('button')).find(b =>
          b.textContent.includes('All Months') || b.textContent.includes('Months')
        );
        if (monthDropdownBtn) monthDropdownBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 500));

  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const julBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Jul-26');
        if (julBtn) julBtn.click();
        const backdrop = document.querySelector('div.fixed.inset-0.z-40');
        if (backdrop) backdrop.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  // Trigger double click on React element directly
  console.log('Triggering React onDoubleClick on Confirmed Card...');
  const triggerRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const card = document.querySelector('div[title*="view executed events"]');
        if (!card) return 'Card not found with title';

        // Find React internal props key
        const propKey = Object.keys(card).find(k => k.startsWith('__reactProps'));
        if (propKey && card[propKey]?.onDoubleClick) {
          card[propKey].onDoubleClick({ stopPropagation: () => {}, preventDefault: () => {} });
          return 'Triggered onDoubleClick via __reactProps';
        }

        // Fallback: dispatch native dblclick
        card.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
        return 'Dispatched native dblclick';
      })()
    `,
    returnByValue: true
  });
  console.log('Double-click action result:', triggerRes.result.value);

  await new Promise(r => setTimeout(r, 2000));

  // Inspect detail view
  const detailRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const banner = document.querySelector('div.bg-slate-900');
        const rows = Array.from(document.querySelectorAll('tbody tr'));
        const backBtn = document.querySelector('button[title*="Return to Overview"]');
        const year2027Count = rows.filter(tr => tr.textContent.includes('2027')).length;
        const smallCount = rows.filter(tr => tr.textContent.includes('Small (<100)') || tr.textContent.includes('75 Pax')).length;

        const rowData = rows.slice(0, 15).map(tr => {
          const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
          return cells.map(c => c.replace(/\\s+/g, ' ')).filter(Boolean).slice(0, 8).join(' | ');
        });

        const selects = Array.from(document.querySelectorAll('select')).map(s => ({
          value: s.value,
          text: s.options[s.selectedIndex]?.text
        }));

        return {
          isDetailView: !!backBtn,
          bannerText: banner ? banner.innerText.replace(/\\n+/g, ' | ') : 'No banner',
          totalDetailRows: rows.length,
          year2027Count,
          smallCount,
          selects,
          sampleRows: rowData,
          currentUrl: window.location.href
        };
      })()
    `,
    returnByValue: true
  });

  console.log('\n--- DETAIL TABLE VALIDATION REPORT ---');
  console.log(JSON.stringify(detailRes.result.value, null, 2));

  // Capture screenshot of detail view
  const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
  const artifactPath = path.resolve('C:/Users/SMohanty6/.gemini/antigravity-cli/brain/8f121399-ba40-4b5b-896b-7bfa6cd15f3d/screenshot_drilldown_verified.png');
  fs.writeFileSync(artifactPath, Buffer.from(screenshotRes.data, 'base64'));
  console.log('\nScreenshot successfully saved to:', artifactPath);

  ws.close();
  edgeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
