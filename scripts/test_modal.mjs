import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9226;

async function test() {
  const tempDir = path.resolve('./.temp_browser_profile_test');
  const chromeProc = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${tempDir}`,
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1500,1000',
    'http://localhost:3000/?tab=events'
  ]);
  await new Promise(r => setTimeout(r, 3000));
  const tabs = await new Promise(res => {
    http.get(`http://127.0.0.1:${PORT}/json`, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
    });
  });
  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let id = 1;
  const send = (m, p = {}) => new Promise((resolve) => {
    const curId = id++;
    const onMsg = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === curId) { ws.removeEventListener('message', onMsg); resolve(data.result); }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id: curId, method: m, params: p }));
  });
  await new Promise(r => ws.addEventListener('open', r));
  await send('Page.enable');
  await send('Runtime.enable');

  ws.addEventListener('message', (evt) => {
    const data = JSON.parse(evt.data);
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('[Browser Console]', data.params.type, data.params.args?.map(a => a.value || a.description));
    }
    if (data.method === 'Runtime.exceptionThrown') {
      console.error('[Browser Exception]', data.params.exceptionDetails);
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  const btns = await send('Runtime.evaluate', {
    expression: 'Array.from(document.querySelectorAll("button")).map(b => b.innerText.trim()).filter(Boolean)',
    returnByValue: true
  });
  console.log('Buttons found on page:', btns.result?.value);

  // Click Audit Mode button
  const clickRes = await send('Runtime.evaluate', {
    expression: '(() => { const b = Array.from(document.querySelectorAll("button")).find(el => el.innerText.includes("Audit Mode")); if (b) { b.click(); return "Clicked: " + b.innerText; } return "Not found"; })()',
    returnByValue: true
  });
  console.log('Click result:', clickRes.result?.value);
  await new Promise(r => setTimeout(r, 1500));

  const modalRes = await send('Runtime.evaluate', {
    expression: '(() => { const m = document.querySelector("div.fixed.inset-0"); return { found: !!m, text: m ? m.innerText.slice(0, 300) : "none" }; })()',
    returnByValue: true
  });
  console.log('Modal result:', modalRes.result?.value);

  chromeProc.kill();
}
test().catch(console.error);
