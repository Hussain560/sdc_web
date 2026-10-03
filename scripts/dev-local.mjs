// Starts the Next.js dev server against the LOCAL Supabase stack (never the hosted project in .env.local).
import { execSync, spawn } from 'node:child_process';

const out = execSync('npx supabase status -o env', {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
});
const env = Object.fromEntries(
  out
    .split(/\r?\n/)
    .map((l) => /^([A-Z_]+)="?(.*?)"?$/.exec(l.trim()))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const child = spawn('npx', ['next', 'dev', '-p', process.env.PORT ?? '3000'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: env.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.ANON_KEY,
  },
});
child.on('exit', (code) => process.exit(code ?? 0));
