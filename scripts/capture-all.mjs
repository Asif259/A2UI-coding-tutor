import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

function findChrome() {
  const c = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
  ];
  const f = c.find(p => p && fs.existsSync(p));
  if (!f) throw new Error('No Chrome found');
  return f;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const outDir = path.resolve('docs/screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  const profile = path.join(os.tmpdir(), 'chrome-tutor-capture-' + Date.now());
  fs.mkdirSync(profile, { recursive: true });
  const portFile = path.join(profile, 'DevToolsActivePort');

  console.log('Launching Chrome...');
  const child = spawn(findChrome(), [
    '--headless=new',
    `--user-data-dir=${profile}`,
    '--remote-debugging-port=0',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-gpu',
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore' });

  let port = null;
  for (let i = 0; i < 150 && !port; i++) {
    await sleep(100);
    try {
      port = parseInt(fs.readFileSync(portFile, 'utf8'), 10) || null;
    } catch {}
  }
  if (!port) {
    child.kill();
    throw new Error('Chrome did not start DevTools port');
  }

  const ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r, j) => {
    ws.addEventListener('open', r, { once: true });
    ws.addEventListener('error', j, { once: true });
  });

  let id = 0;
  const pend = new Map();
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) {
      pend.get(m.id)(m);
      pend.delete(m.id);
    }
  });

  const send = (method, params = {}, sessionId) => new Promise(r => {
    const i = ++id;
    pend.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });

  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = async (m, p) => {
    const r = await send(m, p, sessionId);
    if (r.error) throw new Error(`${m}: ${r.error.message}`);
    return r.result;
  };
  const ev = async x => (await S('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result.value;

  await S('Page.enable');
  await S('Runtime.enable');

  const captureToFile = async (filePath) => {
    const { data } = await S('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot: ${filePath} (${fs.statSync(filePath).size} bytes)`);
  };

  // 1. Landing Page (1440x900)
  console.log('Capturing 01-landing-page.png (1440x900)...');
  await S('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await S('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(2000);
  await captureToFile(path.join(outDir, '01-landing-page.png'));

  // 2. Interactive Tutor Surface (Click starter question)
  console.log('Triggering starter prompt and capturing 02-interactive-surface.png...');
  await ev(`document.querySelectorAll('.starters button')[0]?.click()`);
  // Wait for A2UI card or response to appear
  for (let i = 0; i < 30; i++) {
    await sleep(300);
    const hasCard = await ev(`!!document.querySelector('.card, .a2ui-quiz')`);
    if (hasCard) break;
  }
  await sleep(1500);
  await captureToFile(path.join(outDir, '02-interactive-surface.png'));

  // 3. Providers Modal (Open Providers dialog)
  console.log('Opening Providers dialog and capturing 03-providers-modal.png...');
  await ev(`document.querySelector('header.top button.ghost')?.click()`);
  await sleep(1000);
  await captureToFile(path.join(outDir, '03-providers-modal.png'));

  // Close modal
  await ev(`document.querySelector('dialog.modal button.ghost')?.click()`);
  await sleep(500);

  // 4. Mobile View (390x844)
  console.log('Capturing 04-mobile-view.png at 390x844...');
  await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await S('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(2000);
  await captureToFile(path.join(outDir, '04-mobile-view.png'));

  // Clean up
  child.kill();
  try {
    fs.rmSync(profile, { recursive: true, force: true });
  } catch {}
  console.log('All screenshots captured successfully.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
