import { execSync } from 'child_process';
import path from 'path';

// Use absolute paths to ensure node finds the scripts
const ROOT = process.cwd();

const steps = [
  { name: '🧹 Initializing Database', command: `node "${path.join(ROOT, 'scripts/init-db.js')}"` },
  { name: '📍 Ingesting Stations',   command: `node "${path.join(ROOT, 'scripts/ingest-stations.js')}"` },
  { name: '🚲 Ingesting Trips',      command: `node "${path.join(ROOT, 'scripts/ingest-trips.js')}"` },
  { name: '⚡ Optimizing with Indexes', command: `node "${path.join(ROOT, 'scripts/create-indexes.js')}"` },
  { name: '📊 Running Analysis',     command: `node "${path.join(ROOT, 'scripts/run-all-analysis.js')}"` }
];

async function runPipeline() {
  const start = Date.now();
  console.log('🚀 Starting Bay Wheels Data Pipeline...\n');

  for (const step of steps) {
    console.log(`▶️  ${step.name}...`);
    try {
      // stdio: 'inherit' is key - it shows the output of the sub-scripts in your terminal
      execSync(step.command, { stdio: 'inherit' }); 
      console.log(`✅ Completed: ${step.name}\n`);
    } catch (error) {
      console.error(`\n❌ Failed at step: ${step.name}`);
      process.exit(1);
    }
  }

  const totalTime = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`✨ Pipeline finished successfully in ${totalTime}s!`);
}

runPipeline();