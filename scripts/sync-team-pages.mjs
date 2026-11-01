import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const data = JSON.parse(source.match(/^const DATA=(.+);$/m)[1]);
const body = source.slice(source.indexOf('</head>'));
const check = process.argv.includes('--check');
let stale = 0;
for (const team of data.teams) {
  const file = path.join(root, team.s, 'index.html');
  const current = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const head = current.slice(0, current.indexOf('</head>'));
  const rendered = head + body
    .replace('Simulador do Brasileirão 2026</span>', 'Simulador do Brasileirão 2026 · '+team.n+'</span>')
    .replace('<script src="https://cdnjs.cloudflare.com/', '<script>window.BC_PAGE_TEAM='+JSON.stringify(team.c)+';</script>\n<script src="https://cdnjs.cloudflare.com/');
  if (rendered !== current) {
    stale++;
    if (!check) fs.writeFileSync(file, rendered);
  }
}
if (check && stale) { console.error(stale+' páginas precisam ser sincronizadas.'); process.exitCode = 1; }
else console.log(check ? 'As 20 páginas de clubes estão sincronizadas.' : stale+' páginas de clubes atualizadas; metadados próprios preservados.');
