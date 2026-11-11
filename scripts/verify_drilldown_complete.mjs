import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9223;

async function runTest() {
  console.log('Launching headless Chrome for Verification...');
  const tempDir = path.resolve('./.temp_browser_profile_verify');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempDir}`,
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,960',
    'http://localhost:3000/?tab=event_tracker&kpi=confirmed_events&month=Jul-26&pax=100%2B&status=Confirmed&building=Downtown-3'
  ], { detached: false });

  await new Promise(r => setTimeout(r, 3000));

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

  console.log('\n--- TEST SCENARIO 1: DIRECT LOAD OF URL WITH BUILDING=DOWNTOWN-3 ---');
  await new Promise(r => setTimeout(r, 4000));

  const resScenario1 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const banner = document.querySelector('div.bg-slate-900');
        const rows = Array.from(document.querySelectorAll('tbody tr'));
        const backBtn = document.querySelector('button[title*="Return to Overview"]');
        const sourceBadge = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Source: OneDrive Live'));
        const verificationBadge = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Filter Verified') || s.textContent.includes('Filter mismatch'));

        const selects = Array.from(document.querySelectorAll('select')).map(s => ({
          value: s.value,
          text: s.options[s.selectedIndex]?.text
        }));

        const year2027Count = rows.filter(tr => tr.textContent.includes('2027')).length;
        const smallPaxCount = rows.filter(tr => tr.textContent.includes('Small (<100)') || tr.textContent.includes('75 Pax')).length;
        const sampleRowTexts = rows.slice(0, 5).map(tr => tr.innerText.replace(/\\n+/g, ' | '));

        return {
          url: window.location.href,
          isDetailView: !!backBtn,
          bannerText: banner ? banner.innerText.replace(/\\n+/g, ' | ') : 'No banner',
          verificationBadge: verificationBadge ? verificationBadge.innerText.replace(/\\n+/g, ' ') : 'No badge',
          sourceBadge: sourceBadge ? sourceBadge.innerText.replace(/\\n+/g, ' ') : 'No source badge',
          totalDetailRows: rows.length,
          year2027Count,
          smallPaxCount,
          selects,
          sampleRowTexts
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Scenario 1 Result:', JSON.stringify(resScenario1.result.value, null, 2));

  // Take screenshot for Scenario 1
  const screenshotRes1 = await send('Page.captureScreenshot', { format: 'png' });
  const artifactPath1 = path.resolve('C:/Users/SMohanty6/.gemini/antigravity-cli/brain/8f121399-ba40-4b5b-896b-7bfa6cd15f3d/screenshot_drilldown_verified.png');
  fs.writeFileSync(artifactPath1, Buffer.from(screenshotRes1.data, 'base64'));
  console.log('Saved screenshot to:', artifactPath1);

  console.log('\n--- TEST SCENARIO 2: NAVIGATE TO ALL BUILDINGS (building=All) ---');
  await send('Page.navigate', {
    url: 'http://localhost:3000/?tab=event_tracker&kpi=confirmed_events&month=Jul-26&pax=100%2B&status=Confirmed&building=All'
  });
  await new Promise(r => setTimeout(r, 4000));

  const resScenario2 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const banner = document.querySelector('div.bg-slate-900');
        const rows = Array.from(document.querySelectorAll('tbody tr'));
        const verificationBadge = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Filter Verified') || s.textContent.includes('Filter mismatch'));

        const selects = Array.from(document.querySelectorAll('select')).map(s => ({
          value: s.value,
          text: s.options[s.selectedIndex]?.text
        }));

        const dt3Count = rows.filter(tr => tr.textContent.includes('Downtown-3')).length;
        const dt4Count = rows.filter(tr => tr.textContent.includes('Downtown-4')).length;

        return {
          url: window.location.href,
          bannerText: banner ? banner.innerText.replace(/\\n+/g, ' | ') : 'No banner',
          verificationBadge: verificationBadge ? verificationBadge.innerText.replace(/\\n+/g, ' ') : 'No badge',
          totalDetailRows: rows.length,
          dt3Count,
          dt4Count,
          selects
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Scenario 2 Result:', JSON.stringify(resScenario2.result.value, null, 2));

  console.log('\n--- TEST SCENARIO 3: SEARCH EVT-2027-2036 ---');
  const resScenario3 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const input = document.querySelector('input[placeholder*="Search all columns"]');
        if (input) {
          input.value = 'EVT-2027-2036';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  const resSearch = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const rows = Array.from(document.querySelectorAll('tbody tr'));
        const hasDummy = rows.some(tr => tr.textContent.includes('EVT-2027-2036'));
        const emptyMessage = document.querySelector('td')?.textContent.trim();
        return {
          matchedRowCount: hasDummy ? rows.length : (emptyMessage?.includes('No matching') ? 0 : rows.length),
          hasDummyRow: hasDummy,
          message: emptyMessage
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Scenario 3 Result (Search EVT-2027-2036):', JSON.stringify(resSearch.result.value, null, 2));

  ws.close();
  chromeProc.kill();
  console.log('\nALL VERIFICATION TESTS COMPLETED!');
}

runTest().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
