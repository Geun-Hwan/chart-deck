import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = process.cwd();
const snapshotDir = join(root, 'docs/ui-snapshots');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const requestedPort = Number(process.env.SNAPSHOT_PORT ?? 5173);
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 5173;
const baseUrl = `http://127.0.0.1:${port}`;
const now = new Date();
const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
const chromeProfileDir = await mkdtemp(join(tmpdir(), 'chart-deck-chrome-'));

if (!existsSync(chromePath)) {
  throw new Error(`Chrome 실행 파일을 찾을 수 없습니다: ${chromePath}`);
}

await mkdir(snapshotDir, { recursive: true });

const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, BROWSER: 'none' },
});

let serverOutput = '';
server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString();
});

try {
  await waitForServerReady();
  await capture('studio-empty-workspace', `${baseUrl}/`, '1440,1600');
  await capture('studio-sample-workspace', `${baseUrl}/?sample=monthly-sales`, '1440,1800');
  await capture('studio-large-sampled-workspace', `${baseUrl}/?sample=large-timeseries`, '1440,1800');
} finally {
  server.kill('SIGTERM');
  await safeRemove(chromeProfileDir);
}

async function waitForServerReady() {
  const started = Date.now();
  while (Date.now() - started < 30_000) {
    if (serverOutput.includes(`http://127.0.0.1:${port}/`)) return;
    if (server.exitCode !== null) {
      throw new Error(`Vite 서버가 시작 전에 종료되었습니다.\n${serverOutput}`);
    }
    await delay(200);
  }
  throw new Error(`Vite 서버 시작 시간이 초과되었습니다.\n${serverOutput}`);
}

async function capture(name, url, size) {
  const fileName = `${timestamp}-${name}.png`;
  const outputPath = join(snapshotDir, fileName);
  await runChromeScreenshot(outputPath, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--disable-cache',
    '--disable-background-networking',
    '--disable-component-update',
    '--no-first-run',
    '--no-default-browser-check',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=1000',
    `--user-data-dir=${chromeProfileDir}`,
    `--window-size=${size}`,
    `--screenshot=${outputPath}`,
    url,
  ]);
  console.log(`snapshot: ${outputPath}`);
}

function runChromeScreenshot(outputPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(chromePath, args, { stdio: 'inherit' });
    const timeout = setTimeout(() => {
      if (existsSync(outputPath)) {
        child.kill('SIGTERM');
        resolve();
      } else {
        child.kill('SIGKILL');
        reject(new Error(`Chrome screenshot timed out before writing ${outputPath}`));
      }
    }, 12_000);

    child.on('exit', (code) => {
      clearTimeout(timeout);
      if (code === 0 || existsSync(outputPath)) resolve();
      else reject(new Error(`Chrome screenshot exited with ${code}`));
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function safeRemove(path) {
  await delay(500);
  await rm(path, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
