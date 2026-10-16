import { cp, mkdir } from 'node:fs/promises';

// Optional export for hosts that require a dist directory. GitHub Pages serves the root.
await mkdir('dist', { recursive: true });
for (const entry of ['index.html', 'styles.css', 'app.js', 'assets', '.nojekyll']) {
  await cp(entry, `dist/${entry}`, { recursive: true });
}
console.log('Exportação estática pronta em dist/.');
