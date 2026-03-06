// scripts/tests/run-all-tests.js
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname の代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 実行するテストスクリプト
const tests = [
  'url-test.js',
  'kpi-test.js',
  'optimize-test.js',
  'report-test.js'
];

async function runTest(script) {
  return new Promise((resolve) => {
    const fullPath = path.join(__dirname, script);
    console.log(`\n=== Running ${script} ===`);
    const proc = exec(`node "${fullPath}"`);

    proc.stdout.on('data', data => process.stdout.write(data));
    proc.stderr.on('data', data => process.stderr.write(data));

    proc.on('close', code => {
      if (code === 0) {
        console.log(`✅ ${script} completed successfully`);
      } else {
        console.log(`❌ ${script} exited with code ${code}`);
      }
      resolve(); // 次のテストに進む
    });
  });
}

(async () => {
  for (const test of tests) {
    await runTest(test);
  }
  console.log('\n🎯 All tests finished');
})();