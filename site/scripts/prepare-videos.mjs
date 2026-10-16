import { spawnSync } from 'node:child_process';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Sources remain outside the repository. Usage: node scripts/prepare-videos.mjs <source-directory>
const source = process.argv[2];
if (!source) throw new Error('Informe a pasta dos vídeos originais.');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const output = resolve('assets/videos');
mkdirSync(join(output, 'posters'), { recursive: true });
const clips = [
  ['01-black', 'Você_é_um_diretor_de_fotografi(3).mp4', 0, 10, false, 0],
  ['02-blue', 'Você_é_um_diretor_de_fotografi (1)(3).mp4', 0, 10, false, 4],
  ['03-craft', 'Você_é_um_Diretor_de_Fotografi (3)(6).mp4', 0, 10, false, 6],
  ['04-lavender-bridge', 'gemini_generated_video_17957087(2).mp4', 9.5, 19.9, true, 0],
  ['05-lavender-finale', 'gemini_generated_video_e7cdaf45(2).mp4', 9.5, 19.9, false, 10],
];
function run(args) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('FFmpeg não concluiu a exportação.');
}
const manifest = [];
for (const [name, original, start, end, reverse, posterTime] of clips) {
  const files = [];
  // Mobile: independent frames avoid decoding up to 12 earlier frames per seek.
  // Desktop: short GOPs, no B-frames. Both preserve the original 24 fps.
  for (const [suffix, width, height, keyframeInterval, crf] of [['', 1280, 720, 6, 20], ['-mobile', 854, 480, 1, 22]]) {
    const file = `${name}${suffix}.mp4`;
    run(['-i', join(source, original), '-an', '-vf', `trim=start=${start}:end=${end},setpts=PTS-STARTPTS,${reverse ? 'reverse,' : ''}fps=24,scale=${width}:${height}:flags=lanczos,setsar=1`, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-g', String(keyframeInterval), '-keyint_min', String(keyframeInterval), '-bf', '0', '-sc_threshold', '0', '-movflags', '+faststart', join(output, file)]);
    files.push({ file, bytes: statSync(join(output, file)).size, width, height, fps: 24, keyframeInterval, bFrames: 0, crf });
    console.log(`Preparado: ${file}`);
  }
  run(['-ss', String(posterTime), '-i', join(output, `${name}.mp4`), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', join(output, 'posters', `${name}.webp`)]);
  run(['-i', join(output, `${name}.mp4`), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', join(output, 'posters', `${name}-start.webp`)]);
  manifest.push({ name, source: original, trim: [start, end], reverse, posterTime, files });
}
writeFileSync(join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
