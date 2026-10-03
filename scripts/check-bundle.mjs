// Bundle-size guard (ENG-010, NFR-PERF-003): gzip every client chunk of the last production build and compare the
// total with scripts/perf-budget.json. `node scripts/check-bundle.mjs` after `npm run build`; `--update` rewrites the
// budget (current size + 10 %) when a reviewed change legitimately grows the bundle.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const root = join(process.cwd(), '.next', 'static', 'chunks');
const files = [];
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.js')) files.push(p);
  }
};
walk(root);
const kb = Math.round(files.reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0) / 1024);
const budgetFile = join(process.cwd(), 'scripts', 'perf-budget.json');
if (process.argv.includes('--update')) {
  writeFileSync(
    budgetFile,
    JSON.stringify({ clientChunksGzipKb: Math.ceil(kb * 1.1) }, null, 2) + '\n',
  );
  console.log(`budget updated: ${Math.ceil(kb * 1.1)} kB (current ${kb} kB)`);
  process.exit(0);
}
const budget = JSON.parse(readFileSync(budgetFile, 'utf8')).clientChunksGzipKb;
console.log(`client chunks: ${kb} kB gzip (budget ${budget} kB, ${files.length} files)`);
if (kb > budget) {
  console.error(
    'Over budget: review what grew, then `node scripts/check-bundle.mjs --update` if it is intended.',
  );
  process.exit(1);
}
