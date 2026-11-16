import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const backendVenvPython = path.join(backendDir, 'venv', 'bin', 'python');

console.log('🚀 Starting Chronos System Development Environment...');
console.log('   - Backend: FastAPI on http://localhost:8000');
console.log('   - Frontend: Vite on http://localhost:3000\n');

const backendProc = spawn(
  backendVenvPython,
  ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
  {
    cwd: backendDir,
    env: { ...process.env, PYTHONPATH: backendDir },
    stdio: 'inherit',
  }
);

const frontendProc = spawn(
  'npx',
  ['vite', '--port', '3000', '--host'],
  {
    cwd: rootDir,
    env: { ...process.env },
    stdio: 'inherit',
  }
);

function cleanup() {
  console.log('\n🛑 Shutting down Chronos services...');
  backendProc.kill('SIGTERM');
  frontendProc.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
backendProc.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Backend process exited with code ${code}`);
  }
});
frontendProc.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Frontend process exited with code ${code}`);
  }
});
