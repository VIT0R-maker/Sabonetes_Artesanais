import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { SCENES, mapStory, frameTime } from '../assets/cinematic.js';
import { createStaticServer } from './serve.mjs';

test('scroll mapping: reversible, bounded, maximum two videos, final hold', () => {
  const forwards = [];
  for (let step = 0; step <= 1000; step++) {
    const state = mapStory(step / 1000);
    assert.ok(state.layers.length >= 1 && state.layers.length <= 2);
    assert.ok(state.layers.some(layer => layer.opacity === 1), 'No black dip between layers');
    for (const layer of state.layers) {
      assert.ok(layer.progress >= 0 && layer.progress <= 1);
      assert.ok(layer.opacity >= 0 && layer.opacity <= 1);
    }
    forwards.push(state);
  }
  for (let step = 1000; step >= 0; step--) assert.deepEqual(mapStory(step / 1000), forwards[step]);
  assert.equal(mapStory(.94).layers[0].progress, 1);
  assert.equal(mapStory(1).layers[0].progress, 1);
  assert.equal(mapStory(.97).exit, 0);
  assert.equal(mapStory(1).exit, 1);
  for (const scene of SCENES.slice(1)) {
    const state = mapStory(scene.start);
    assert.equal(state.layers.length, 2);
    assert.ok(Math.abs(state.layers[1].opacity - .5) < .0001);
  }
});

test('media exists, has faststart and no accidental source videos', () => {
  const manifest = JSON.parse(readFileSync('assets/videos/manifest.json'));
  assert.equal(manifest.length, 5);
  assert.equal(manifest.filter(clip => clip.reverse).length, 1);
  for (const scene of SCENES) {
    assert.ok(existsSync(`assets/videos/posters/${scene.file}.webp`));
    for (const suffix of ['', '-mobile']) {
      const file = `assets/videos/${scene.file}${suffix}.mp4`;
      const buffer = readFileSync(file);
      assert.ok(buffer.indexOf('moov') < buffer.indexOf('mdat'), `${file}: faststart`);
      assert.ok(buffer.length < 15 * 1024 * 1024);
    }
  }
  const html = readFileSync('index.html', 'utf8');
  const videos = [...html.matchAll(/<video\b([^>]*)>/g)];
  assert.equal(videos.length, 5);
  for (const [, attributes] of videos) {
    assert.doesNotMatch(attributes, /\b(?:src|autoplay|loop|controls)=?/);
    assert.match(attributes, /aria-hidden="true"/);
    assert.match(attributes, /playsinline/);
  }
});

test('seek targets are frame-aligned and never reach the end-of-file boundary', () => {
  for (const duration of [10, 10.416667]) {
    let previous = -1;
    for (let step = 0; step <= 1000; step++) {
      const time = frameTime(step / 1000, duration);
      assert.ok(time >= previous && time < duration);
      assert.ok(Math.abs((time * 24 - .25) - Math.round(time * 24 - .25)) < .000001);
      previous = time;
    }
    assert.equal(frameTime(-1, duration), frameTime(0, duration));
    assert.equal(frameTime(2, duration), frameTime(1, duration));
  }
});

test('static server: seeks, HEAD, invalid ranges, and Pages subdirectory', async () => {
  const server = createStaticServer(resolve('.'), '/Sabonetes_Artesanais/');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/Sabonetes_Artesanais/`;
    const file = 'assets/videos/01-black-mobile.mp4';
    const size = statSync(file).size;
    let response = await fetch(base + file, { headers: { Range: 'bytes=1024-2047' } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-type'), 'video/mp4');
    assert.equal(response.headers.get('content-range'), `bytes 1024-2047/${size}`);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), readFileSync(file).subarray(1024, 2048));
    response = await fetch(base + file, { headers: { Range: 'bytes=-20' } });
    assert.equal((await response.arrayBuffer()).byteLength, 20);
    response = await fetch(base + file, { headers: { Range: `bytes=${size}-` } });
    assert.equal(response.status, 416);
    response = await fetch(base + file, { method: 'HEAD' });
    assert.equal(response.headers.get('content-length'), String(size));
    assert.equal((await response.arrayBuffer()).byteLength, 0);
    assert.equal((await fetch(base)).status, 200);
    assert.equal((await fetch(base + 'assets/cinematic.js')).status, 200);
    assert.equal((await fetch(base + '.git/config')).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
