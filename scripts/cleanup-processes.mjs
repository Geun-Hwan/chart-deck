import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const patterns = [
  {
    name: 'Vite 개발 서버',
    includes: ['node_modules/.bin/vite', '--host', '127.0.0.1'],
  },
  {
    name: '헤드리스 Chrome 스냅샷',
    includes: ['Google Chrome', '--headless', '--screenshot='],
  },
  {
    name: 'Notion MCP remote 중복 프로세스',
    includes: ['mcp-remote', 'https://mcp.notion.com/mcp'],
  },
];

const processes = await listProcesses();
let killed = 0;

for (const processInfo of processes) {
  if (processInfo.pid === process.pid) continue;
  const matched = patterns.find((pattern) => pattern.includes.every((part) => processInfo.command.includes(part)));
  if (!matched) continue;

  try {
    process.kill(processInfo.pid, 'SIGTERM');
    killed += 1;
    console.log(`killed ${matched.name}: ${processInfo.pid}`);
  } catch (error) {
    console.warn(`skip ${processInfo.pid}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`cleanup complete: ${killed} processes signaled`);

async function listProcesses() {
  const { stdout } = await execFileAsync('ps', ['-axo', 'pid=,command=']);
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (!match) return null;
      return { pid: Number(match[1]), command: match[2] };
    })
    .filter((item) => item !== null);
}
