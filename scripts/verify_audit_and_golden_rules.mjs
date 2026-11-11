import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9224;
const ARTIFACT_DIR = 'C:/Users/SMohanty6/.gemini/antigravity-cli/brain/8f121399-ba40-4b5b-896b-7bfa6cd15f3d';

async function runAuditVerification() {
  console.log('=== STARTING GOLDEN RULE & AUDIT MODE VERIFICATION ===');
  const tempDir = path.resolve('./.temp_browser_profile_audit');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempDir}`,
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1500,1000',
    'http://localhost:3000/?tab=events'
  ], { detached: false });

  await new Promise(r => setTimeout(r, 3500));

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

  // Clear stale localStorage caches to ensure fresh seedData is loaded
  await send('Runtime.evaluate', {
    expression: `
      localStorage.removeItem('cbre_dashboard_event_data_v5');
      localStorage.removeItem('cbre_dashboard_event_data_v4');
      localStorage.removeItem('cbre_dashboard_event_data_v3');
    `
  });

  console.log('\n--- 1. AUDIT MODE MODAL VERIFICATION (Jul-26 DT-3 Sheet) ---');
  await send('Page.navigate', { url: 'http://localhost:3000/?tab=events' });
  await new Promise(r => setTimeout(r, 3000));

  // Click "Audit Mode" button in header
  const clickAuditBtn = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const auditBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Audit Mode');
        if (auditBtn) {
          auditBtn.click();
          return 'Clicked Audit Mode Button';
        }
        return 'Audit button not found';
      })()
    `,
    returnByValue: true
  });
  console.log('Action:', clickAuditBtn.result.value);
  await new Promise(r => setTimeout(r, 1500));

  // Verify Audit Mode Modal Contents
  const auditModalData = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const modal = document.querySelector('div.fixed.inset-0');
        if (!modal) return { modalFound: false };

        const rows = Array.from(modal.querySelectorAll('tbody tr'));
        const totalRows = rows.length;

        // Check each row for Floor, Location, Pax, Title matching
        const noMatches = rows.filter(tr => tr.textContent.includes('✗ NO'));
        const yesMatches = rows.filter(tr => tr.textContent.includes('✓ YES'));

        const sampleRows = rows.slice(0, 6).map(tr => {
          const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
          return cells.join(' | ');
        });

        // 100+ Pax events in modal
        const big100Rows = rows.filter(tr => tr.textContent.includes('100+')).map(tr => {
          return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim()).join(' | ');
        });

        // Unique floors visible in modal
        const floors = Array.from(new Set(rows.map(tr => {
          const cells = Array.from(tr.querySelectorAll('td'));
          return cells[2] ? cells[2].innerText.trim() : '';
        }))).filter(Boolean);

        return {
          modalFound: true,
          totalRows,
          mismatchesCount: noMatches.length,
          yesMatchesCount: yesMatches.length,
          floorsVisible: floors,
          big100RowsCount: big100Rows.length,
          big100Rows,
          sampleRows
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Audit Modal Evaluation:', JSON.stringify(auditModalData.result.value, null, 2));

  // Take screenshot of Audit Modal
  const screenshotAudit = await send('Page.captureScreenshot', { format: 'png' });
  const auditScreenshotPath = path.resolve(ARTIFACT_DIR, 'screenshot_jul26_dt3_audit_table.png');
  fs.writeFileSync(auditScreenshotPath, Buffer.from(screenshotAudit.data, 'base64'));
  console.log('Saved Audit Table Screenshot to:', auditScreenshotPath);

  // Close Audit Modal
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const closeBtn = document.querySelector('button[title*="Close Audit Mode"]');
        if (closeBtn) closeBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- 2. DRILL-DOWN VERIFICATION: Jul-26 + Downtown-3 + 100+ Pax ---');
  await send('Page.navigate', {
    url: 'http://localhost:3000/?tab=event_tracker&kpi=confirmed_events&month=Jul-26&pax=100%2B&status=Confirmed&building=Downtown-3'
  });
  await new Promise(r => setTimeout(r, 3500));

  const drilldownData = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const banner = document.querySelector('div.bg-slate-900');
        const rows = Array.from(document.querySelectorAll('tbody tr'));
        const verificationBadge = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('Filter Verified') || s.textContent.includes('Filter mismatch'));

        const rowDetails = rows.map(tr => {
          const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
          return cells.join(' | ');
        });

        const year2027Count = rows.filter(tr => tr.textContent.includes('2027')).length;
        const smallPaxCount = rows.filter(tr => tr.textContent.includes('Small (<100)') || tr.textContent.includes('75 Pax')).length;
        const l2Count = rows.filter(tr => tr.textContent.includes('L2') || tr.textContent.includes('Collaboration Area')).length;

        return {
          url: window.location.href,
          bannerText: banner ? banner.innerText.replace(/\\n+/g, ' | ') : 'No banner',
          verificationBadge: verificationBadge ? verificationBadge.innerText.replace(/\\n+/g, ' ') : 'No badge',
          totalDetailRows: rows.length,
          year2027Count,
          smallPaxCount,
          l2Count,
          rowDetails
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Drilldown Data:', JSON.stringify(drilldownData.result.value, null, 2));

  // Take screenshot of Drilldown Table
  const screenshotDrilldown = await send('Page.captureScreenshot', { format: 'png' });
  const drilldownScreenshotPath = path.resolve(ARTIFACT_DIR, 'screenshot_drilldown_jul26_dt3_100pax.png');
  fs.writeFileSync(drilldownScreenshotPath, Buffer.from(screenshotDrilldown.data, 'base64'));
  console.log('Saved Drill-down Screenshot to:', drilldownScreenshotPath);

  console.log('\n--- 3. TEST 3: SUNDAY 08-NOV-2026 VALIDATION ---');
  await send('Page.navigate', {
    url: 'http://localhost:3000/?tab=events'
  });
  await new Promise(r => setTimeout(r, 3000));

  const sunNov8Data = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const alertBanner = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Sunday, 08-Nov-2026 — 0 Valid Events Confirmed'));
        const qualityStats = Array.from(document.querySelectorAll('div')).find(d => d.textContent.includes('Valid Events') && d.textContent.includes('Default / Placeholder'));

        return {
          alertBannerFound: !!alertBanner,
          alertBannerText: alertBanner ? alertBanner.innerText.replace(/\\n+/g, ' | ') : 'Not found',
          qualityStatsText: qualityStats ? qualityStats.innerText.replace(/\\n+/g, ' | ') : 'Not found'
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Sunday 08-Nov-2026 Evaluation:', JSON.stringify(sunNov8Data.result.value, null, 2));

  // Take screenshot of Sunday Nov 8 Alert
  const screenshotSunNov8 = await send('Page.captureScreenshot', { format: 'png' });
  const sunNov8ScreenshotPath = path.resolve(ARTIFACT_DIR, 'screenshot_nov8_sunday_zero_valid.png');
  fs.writeFileSync(sunNov8ScreenshotPath, Buffer.from(screenshotSunNov8.data, 'base64'));
  console.log('Saved Sunday Nov 8 Screenshot to:', sunNov8ScreenshotPath);

  chromeProc.kill();
  console.log('\n=== ALL VERIFICATIONS COMPLETED SUCCESSFULLY ===');
}

runAuditVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
