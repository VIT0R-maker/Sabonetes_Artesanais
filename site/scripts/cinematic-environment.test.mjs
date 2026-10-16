import test from 'node:test';
import assert from 'node:assert/strict';
import { createCinematicStory } from '../assets/cinematic.js';

// A controllable media environment exercises failure paths that browser viewport
// emulation cannot provide (Save-Data, stalled seeks and media decode errors).
function environment({ reduced = false, saveData = false } = {}) {
  const restore = [], queue = new Map();
  let sequence = 0, options, trigger, clock = 0;
  function element() {
    const attributes = new Map(), classes = new Set(), events = new Map();
    return {
      style: { removeProperty(name) { delete this[name]; }, setProperty(name, value) { this[name] = value; } },
      classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name), toggle: (name, value) => value ? classes.add(name) : classes.delete(name) },
      dataset: {}, links: [], inert: false,
      addEventListener(name, callback) { events.set(name, callback); },
      emit(name) { events.get(name)?.(); },
      setAttribute: (key, value) => attributes.set(key, value),
      getAttribute: key => attributes.get(key) ?? null,
      hasAttribute: key => attributes.has(key),
      removeAttribute: key => attributes.delete(key),
      querySelectorAll() { return this.links; },
      scrollIntoView() {}, focus() {},
    };
  }
  const videos = Array.from({ length: 5 }, () => {
    const video = element();
    let time = 0;
    Object.defineProperties(video, {
      src: { set(value) { this.setAttribute('src', value); } },
      currentTime: { get() { return time; }, set(value) { time = value; this.seeking = true; this.seeks++; } },
    });
    Object.assign(video, { readyState: 4, duration: 10, seeking: false, seeks: 0, load() {}, pause() {} });
    return video;
  });
  const copies = videos.map(() => element());
  copies[0].links = [element(), element()]; copies[4].links = [element(), element()];
  const cards = videos.map((video, index) => Object.assign(element(), {
    links: copies[index].links,
    querySelector: selector => selector === 'video' ? video : selector === 'img' ? element() : copies[index],
  }));
  const steps = [element(), element(), element()];
  const mode = element(), stage = element(), header = element();
  const poster = { decode: () => Promise.resolve() };
  const section = Object.assign(element(), {
    getBoundingClientRect: () => ({ top: 0, bottom: 6200 }),
    querySelector: selector => ({ '.cinematic-stage': stage, '.cinematic-mode': mode, '#hero-image': poster }[selector] || element()),
    querySelectorAll: selector => selector === '.cinematic-scene' ? cards : steps,
  });
  const ScrollTrigger = { create(config) {
    options = config;
    trigger = { isActive: true, progress: 0, kill() {}, refresh() {} };
    return trigger;
  }, refresh() {} };
  const globals = {
    document: { hidden: false, querySelector: selector => selector === '#header' ? header : section, addEventListener() {} },
    window: { ScrollTrigger, addEventListener() {} },
    navigator: { connection: { saveData, addEventListener() {} } },
    matchMedia: query => ({ matches: query.includes('reduce') && reduced, addEventListener() {} }),
    requestAnimationFrame: callback => { queue.set(++sequence, callback); return sequence; },
    cancelAnimationFrame: id => queue.delete(id),
    innerHeight: 900,
  };
  for (const [key, value] of Object.entries(globals)) {
    restore.push([key, Object.getOwnPropertyDescriptor(globalThis, key)]);
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  return {
    videos, section, copies, mode,
    update(progress) { trigger.progress = progress; options.onUpdate(trigger); },
    tick(delta = 100) { clock += delta; const callbacks = [...queue.values()]; queue.clear(); callbacks.forEach(callback => callback(clock)); },
    finishSeeks() { videos.forEach(video => { if (video.seeking) { video.seeking = false; video.emit('seeked'); } }); },
    restore() { for (const [key, descriptor] of restore) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } },
  };
}

for (const preference of ['reduced', 'saveData']) {
  test(`${preference}: zero video sources, all HTML actions available`, async () => {
    const env = environment({ [preference]: true });
    try {
      const story = createCinematicStory();
      await story.ready;
      assert.equal(env.section.classList.contains('is-cinematic'), false);
      assert.ok(env.videos.every(video => !video.hasAttribute('src')));
      assert.ok(env.copies.flatMap(copy => copy.links).every(link => !link.inert));
    } finally { env.restore(); }
  });
}

test('preloads only first two, coalesces seeks, reverses, and releases distant media', () => {
  const env = environment();
  try {
    createCinematicStory();
    assert.deepEqual(env.videos.map(video => video.hasAttribute('src')), [true, true, false, false, false]);
    assert.equal(env.videos[1].preload, 'metadata');
    env.update(.1); env.tick();
    env.videos[0].readyState = 1;
    const seeks = env.videos[0].seeks;
    env.update(.15); env.tick();
    assert.equal(env.videos[0].seeks, seeks, 'No overlapping seeks on the same decoder');
    assert.equal(env.section.dataset.mode, 'video', 'Seeking with HAVE_METADATA is not a network failure');
    env.videos[0].readyState = 4;
    for (let frame = 0; frame < 30; frame++) { env.finishSeeks(); env.tick(); }
    const forward = env.videos[0].currentTime;
    env.update(.05);
    for (let frame = 0; frame < 30; frame++) { env.finishSeeks(); env.tick(); }
    assert.ok(env.videos[0].currentTime < forward);
    env.update(.85);
    for (let frame = 0; frame < 30; frame++) { env.finishSeeks(); env.tick(); }
    assert.equal(env.videos[0].hasAttribute('src'), false);
    assert.equal(env.videos[1].hasAttribute('src'), false);
    assert.equal(env.videos[4].hasAttribute('src'), true);
  } finally { env.restore(); }
});

for (const failure of ['error', 'stalled-seek', 'manual']) {
  test(`${failure}: restores static content and frees every video`, () => {
    const env = environment();
    try {
      createCinematicStory(); env.tick();
      if (failure === 'error') env.videos[0].emit('error');
      else if (failure === 'manual') env.mode.emit('click');
      else { env.update(.1); env.tick(); env.tick(4000); }
      assert.equal(env.section.classList.contains('is-cinematic'), false);
      assert.ok(env.videos.every(video => !video.hasAttribute('src')));
      assert.ok(env.copies.flatMap(copy => copy.links).every(link => !link.inert));
    } finally { env.restore(); }
  });
}
