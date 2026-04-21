/**
 * Runs before `npm run dev`:
 * 1. Kills any process holding port 3000 (prevents "Starting..." hang)
 * 2. Removes .next cache (prevents stale build issues)
 */
const { execSync } = require('child_process');
const { rmSync, existsSync } = require('fs');
const path = require('path');

// ── Kill port 3000 ────────────────────────────────────────────────────────────
try {
  const result = execSync(
    'netstat -ano | findstr ":3000 "',
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
  );
  const pids = [...new Set(
    result.split('\n')
      .map(line => line.trim().split(/\s+/).pop())
      .filter(pid => pid && /^\d+$/.test(pid) && pid !== '0')
  )];
  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`  killed process ${pid} on port 3000`);
    } catch {}
  }
} catch {
  // No process on port 3000 — that's fine
}

// ── Remove .next cache ────────────────────────────────────────────────────────
const nextDir = path.join(__dirname, '..', '.next');
if (existsSync(nextDir)) {
  try {
    rmSync(nextDir, { recursive: true, force: true });
    console.log('  cleared .next cache');
  } catch (err) {
    // Still locked — wait 1s and retry once
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    try {
      rmSync(nextDir, { recursive: true, force: true });
      console.log('  cleared .next cache (retry)');
    } catch {
      console.warn('  could not clear .next — continuing anyway');
    }
  }
}
