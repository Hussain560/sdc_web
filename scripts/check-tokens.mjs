// Design System v2 guard: no hex or rgb()/hsl() colour literal anywhere in src/ or app/ except primitives.css.
//   node scripts/check-tokens.mjs            (npm run check:tokens)
// Legacy files that still hold literals are listed in scripts/token-allowlist.json with the number of literals they
// hold TODAY. The list only shrinks: a file may not gain literals, and a file that no longer has any must be removed
// from the list (so the check keeps getting stricter). New files are never allowed to have literals.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const allow = JSON.parse(readFileSync(join(root, 'scripts/token-allowlist.json'), 'utf8'));
const legacy = allow.legacy;
const exempt = allow.exempt;

const SKIP_DIRS = new Set(['node_modules', '.next', '.next-auth']);
const EXT = /\.(css|ts|tsx)$/;
// #rgb, #rgba, #rrggbb, #rrggbbaa not glued to a word (so ids like #content or &#39; do not match), and rgb()/rgba()/hsl().
const LITERAL =
  /(?<![\w&/-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])|\b(?:rgba?|hsla?)\(/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXT.test(name)) yield p;
  }
}

const counts = {};
for (const dir of ['src', 'app']) {
  for (const file of walk(join(root, dir))) {
    const rel = relative(root, file).split(sep).join('/');
    if (rel === 'src/styles/primitives.css') continue;
    const text = readFileSync(file, 'utf8');
    // ignore comments so documentation may quote a colour
    const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const n = (code.match(LITERAL) ?? []).length;
    if (n > 0) counts[rel] = n;
  }
}

if (process.argv.includes('--counts')) {
  console.log(JSON.stringify(counts, null, 2));
  process.exit(0);
}

const problems = [];
for (const [file, n] of Object.entries(counts)) {
  if (exempt[file]) continue;
  const max = legacy[file];
  if (max === undefined)
    problems.push(`${file}: ${n} colour literal(s). Use a semantic token (src/styles/tokens.css).`);
  else if (n > max)
    problems.push(`${file}: ${n} literals, the allowlist allows ${max}. The list only shrinks.`);
}
for (const [file, max] of Object.entries(legacy)) {
  const n = counts[file] ?? 0;
  if (n === 0)
    problems.push(`${file}: no literals left. Remove it from scripts/token-allowlist.json.`);
  else if (n < max)
    problems.push(
      `${file}: now ${n} literal(s), the allowlist says ${max}. Lower it in scripts/token-allowlist.json.`,
    );
}

if (problems.length) {
  console.log(problems.join('\n'));
  console.log(`\n${problems.length} token problem(s)`);
  process.exit(1);
}
const legacyCount = Object.keys(legacy).length;
console.log(
  `Token check passed (${legacyCount} legacy file(s) still on the allowlist, ${Object.keys(exempt).length} exempt)`,
);
