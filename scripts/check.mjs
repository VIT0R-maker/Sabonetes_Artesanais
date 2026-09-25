import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = resolve('dist');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const errors = [];
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
if (new Set(ids).size !== ids.length) errors.push('IDs duplicados');
for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (ref.startsWith('#')) { if (!ids.includes(ref.slice(1))) errors.push(`Âncora ausente: ${ref}`); }
  else if (!/^(https?:|data:)/.test(ref) && !existsSync(join(root, ref))) errors.push(`Arquivo ausente: ${ref}`);
}
for (const [, set] of html.matchAll(/srcset="([^"]+)"/g)) {
  for (const entry of set.split(',')) if (!existsSync(join(root, entry.trim().split(' ')[0]))) errors.push(`Imagem ausente: ${entry}`);
}
for (const [, tag] of html.matchAll(/(<img\b[^>]*>)/g)) if (!/alt="[^"]+"/.test(tag)) errors.push('Imagem sem descrição');
for (const [, url] of html.matchAll(/href="(https:\/\/wa\.me\/[^"?]+)[^"]*"/g)) if (url !== 'https://wa.me/5516991753408') errors.push('Número incorreto');
if (!html.includes('https://www.instagram.com/saboaria130/')) errors.push('Instagram ausente');
if (!html.includes('lang="pt-BR"')) errors.push('Idioma ausente');
const walk = dir => readdirSync(dir).flatMap(name => { const file = join(dir, name); return statSync(file).isDirectory() ? walk(file) : [file]; });
const files = walk(root);
for (const file of files.filter(f => /\.(html|js|css)$/.test(f))) {
  const text = readFileSync(file, 'utf8');
  if (/ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]+/.test(text)) errors.push('Credencial encontrada no site');
  if (text.includes('\uFFFD')) errors.push(`Codificação inválida: ${file}`);
}
execFileSync(process.execPath, ['--check', join(root, 'app.js')]);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK: ${ids.length} âncoras, referências de imagens, links de contato, JavaScript e codificação. ${files.length} arquivos públicos.`);
