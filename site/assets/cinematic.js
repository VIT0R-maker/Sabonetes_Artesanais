export const SCENES = [
  { name: 'black', file: '01-black', start: 0, end: .20 },
  { name: 'blue', file: '02-blue', start: .20, end: .39 },
  { name: 'craft', file: '03-craft', start: .39, end: .61 },
  { name: 'bridge', file: '04-lavender-bridge', start: .61, end: .76 },
  { name: 'finale', file: '05-lavender-finale', start: .76, end: 1 },
];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
const overlapAt = index => index === 1 ? .024 : .008;
const FPS = 24;
const setStyle = (element, property, value) => {
  const text = String(value);
  if (element.style[property] !== text) element.style[property] = text;
};

// Sample inside the selected frame, avoiding floating-point seeks onto its border.
export function frameTime(progress, duration) {
  const lastFrame = Math.max(0, Math.round(duration * FPS) - 1);
  return (Math.round(clamp(progress) * lastFrame) + .25) / FPS;
}

// Pure mapping, shared with the regression checks. The last 8% holds the hero shot.
export function mapStory(progress) {
  const p = clamp(progress);
  const active = Math.max(0, SCENES.findLastIndex(scene => p >= scene.start));
  const local = index => clamp((p - SCENES[index].start) / ((index === 4 ? .92 : SCENES[index].end) - SCENES[index].start));
  const boundary = SCENES.findIndex((scene, index) => index > 0 && Math.abs(p - scene.start) < overlapAt(index) / 2);
  const layers = boundary > 0
    ? [{ index: boundary - 1, progress: local(boundary - 1), opacity: 1 }, { index: boundary, progress: local(boundary), opacity: smooth((p - SCENES[boundary].start) / overlapAt(boundary) + .5) }]
    : [{ index: active, progress: local(active), opacity: 1 }];
  return { active, layers, local: local(active), exit: smooth((p - .975) / .025) };
}

export function createCinematicStory() {
  const section = document.querySelector('.cinematic-story');
  const stage = section.querySelector('.cinematic-stage');
  const cards = [...section.querySelectorAll('.cinematic-scene')];
  const videos = cards.map(card => card.querySelector('video'));
  const copies = cards.map(card => card.querySelector('.cinematic-copy'));
  const links = copies.map(copy => [...copy.querySelectorAll('a')]);
  const steps = [...section.querySelectorAll('.cinematic-step')];
  const status = section.querySelector('.cinematic-counter');
  const progressBar = section.querySelector('.cinematic-progress span');
  const modeButton = section.querySelector('.cinematic-mode');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  // Choose once before assigning any src. Resizing does not redownload the same film.
  const mobile = matchMedia('(max-width: 1023px)').matches || matchMedia('(pointer: coarse)').matches;
  const newState = () => ({ target: 0, requested: null, seekAt: 0, waitingSince: null, shown: false, visible: false });
  const states = videos.map(newState);
  let trigger, frame = 0, target = 0, current = 0, enabled = false, manualStatic = false;
  let scrollStart = 0, scrollEnd = 1, stageHeight = innerHeight, direction = 1, lastActive = -1;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  function unload(index) {
    const video = videos[index];
    if (!video.hasAttribute('src')) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
    states[index] = newState();
    cards[index].classList.remove('has-frame');
  }

  function load(index, preload = 'auto') {
    const video = videos[index];
    if (!video) return;
    if (video.preload !== preload) video.preload = preload;
    if (video.hasAttribute('src')) return;
    video.muted = true;
    video.src = `assets/videos/${SCENES[index].file}${mobile ? '-mobile' : ''}.mp4`;
    video.load();
  }

  function staticMode(reason) {
    const keepScene = enabled && trigger?.isActive ? mapStory(current).active : null;
    enabled = false;
    cancelAnimationFrame(frame); frame = 0;
    trigger?.kill(); trigger = null;
    section.classList.remove('is-cinematic');
    section.dataset.mode = reason;
    stage.style.removeProperty('--exit');
    cards.forEach((card, index) => {
      card.style.removeProperty('opacity');
      card.style.removeProperty('pointer-events');
      card.inert = false;
      links[index].forEach(link => { link.inert = false; });
      copies[index].style.removeProperty('opacity');
      copies[index].style.removeProperty('pointer-events');
      card.querySelector('img').src = `assets/videos/posters/${SCENES[index].file}.webp`;
      unload(index);
    });
    steps.forEach(step => { step.style.removeProperty('opacity'); step.removeAttribute('aria-hidden'); });
    modeButton.hidden = true;
    document.querySelector('#header').classList.remove('over-cinema');
    resolveReady();
    window.ScrollTrigger?.refresh();
    if (keepScene !== null && reason !== 'manual') cards[keepScene].scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  function wake() {
    if (enabled && !frame && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function seek(index, now) {
    const video = videos[index], state = states[index];
    if (!state.visible || !enabled || document.hidden) return;
    if (!video.hasAttribute('src')) load(index);
    // Seeking normally drops readyState to HAVE_METADATA; that is not a load failure.
    if (video.seeking) {
      if (state.seekAt && now - state.seekAt > 3500) staticMode('seek-timeout');
      return;
    }
    if (video.readyState < 2 || !Number.isFinite(video.duration)) {
      // Keep its poster visible on a slow connection; never expose an empty video.
      state.waitingSince ??= now;
      if (now - state.waitingSince > 12000) staticMode('video-timeout');
      return;
    }
    state.waitingSince = null;
    const time = frameTime(state.target, video.duration);
    if (state.requested !== time) {
      state.seekAt = now;
      state.requested = time;
      try { video.currentTime = time; } catch { staticMode('seek-error'); }
    } else if (!state.shown) {
      state.shown = true;
      cards[index].classList.add('has-frame');
    }
  }

  function render(now) {
    const state = mapStory(current);
    const visible = new Set(state.layers.map(layer => layer.index));
    cards.forEach((card, index) => {
      const layer = state.layers.find(item => item.index === index);
      setStyle(card, 'opacity', layer ? layer.opacity : 0);
      setStyle(card, 'pointerEvents', index === state.active ? 'auto' : 'none');
      states[index].visible = !!layer;
      if (index < state.active - 1 || index > state.active + 1) unload(index);
    });
    for (const layer of state.layers) {
      // Overwrite the destination even while decoding. Never queue old positions.
      states[layer.index].target = layer.progress;
      seek(layer.index, now);
      if (!enabled) return;
    }
    // Metadata for the second scene initially; one full scene ahead near its boundary.
    const ahead = state.active + direction;
    if (ahead >= 0 && ahead < videos.length) {
      const approaching = direction > 0 ? state.local > .3 : state.local < .7;
      load(ahead, approaching ? 'auto' : 'metadata');
    }
    copies.forEach((copy, index) => {
      let alpha = 0;
      if (visible.has(index)) {
        const p = state.layers.find(layer => layer.index === index).progress;
        if (index === 0) alpha = 1 - smooth((p - .48) / .25);
        else if (index === 4) alpha = smooth((p - .91) / .07);
        else alpha = smooth((p - .10) / .13) * (1 - smooth((p - .73) / .16));
      }
      setStyle(copy, 'opacity', alpha);
      setStyle(copy, 'pointerEvents', alpha < .95 ? 'none' : 'auto');
      links[index].forEach(link => { if (link.inert !== (alpha < .95)) link.inert = alpha < .95; });
    });
    const craftProgress = state.layers.find(layer => layer.index === 2)?.progress ?? -1;
    const stepIndex = craftProgress < .38 ? 0 : craftProgress < .65 ? 1 : 2;
    steps.forEach((step, index) => setStyle(step, 'opacity', index === stepIndex ? 1 : 0));
    if (state.active !== lastActive) { status.textContent = `0${state.active + 1} / 05`; lastActive = state.active; }
    setStyle(progressBar, 'transform', `scaleX(${current})`);
    if (stage.style.getPropertyValue('--exit') !== String(state.exit)) stage.style.setProperty('--exit', state.exit);
  }

  function tick(now) {
    frame = 0;
    if (!enabled || document.hidden) return;
    // Read the native scroll position in this frame: no second animation clock,
    // exponential catch-up or one-frame-old ScrollTrigger progress on touch devices.
    const scroll = window.scrollY;
    target = clamp((scroll - scrollStart) / Math.max(1, scrollEnd - scrollStart));
    if (target !== current) direction = target > current ? 1 : -1;
    current = target;
    if (scroll >= scrollEnd + stageHeight || scroll + innerHeight <= scrollStart) {
      videos.forEach((_, index) => unload(index));
      current = target;
      return;
    }
    render(now);
    // No permanent decode/render loop once the playhead settles or the section leaves view.
    const busy = mapStory(current).layers.some(({ index }) => videos[index].seeking || videos[index].readyState < 2);
    if (enabled && busy) wake();
  }

  function start() {
    if (reduced.matches || connection?.saveData || manualStatic || !window.ScrollTrigger) {
      staticMode(reduced.matches ? 'reduced-motion' : connection?.saveData ? 'save-data' : 'static');
      return;
    }
    enabled = true;
    section.classList.add('is-cinematic');
    section.dataset.mode = 'video';
    cards.forEach((card, index) => {
      const firstFrame = `assets/videos/posters/${SCENES[index].file}-start.webp`;
      card.querySelector('img').src = firstFrame;
      videos[index].poster = firstFrame;
    });
    modeButton.hidden = false;
    const documentTop = () => section.getBoundingClientRect().top + window.scrollY;
    trigger = window.ScrollTrigger.create({
      trigger: section,
      // Numeric document bounds also work when history restores a nonzero scroll
      // before ScrollTrigger's cached scroller value has caught up.
      start: documentTop,
      end: () => documentTop() + section.offsetHeight - stage.offsetHeight,
      onUpdate(self) { target = self.progress; wake(); },
      onToggle(self) {
        document.querySelector('#header').classList.toggle('over-cinema', self.isActive);
        if (self.isActive) wake();
      },
      onRefresh(self) {
        scrollStart = self.start; scrollEnd = self.end; stageHeight = stage.offsetHeight;
        target = self.progress; current = target; wake();
      },
    });
    target = current = trigger.progress;
    scrollStart = trigger.start; scrollEnd = trigger.end; stageHeight = stage.offsetHeight;
    load(mapStory(current).active);
    if (current === 0) load(1, 'metadata');
    wake();
  }

  videos.forEach((video, index) => {
    video.addEventListener('loadeddata', () => {
      if (!enabled) return;
      if (index === 0) resolveReady();
      wake();
    });
    video.addEventListener('seeked', () => {
      if (!enabled || !video.hasAttribute('src') || video.readyState < 2) return;
      states[index].seekAt = 0;
      states[index].shown = true;
      cards[index].classList.add('has-frame');
      const latest = mapStory(clamp((window.scrollY - scrollStart) / Math.max(1, scrollEnd - scrollStart)));
      const layer = latest.layers.find(layer => layer.index === index);
      states[index].visible = !!layer;
      if (layer) states[index].target = layer.progress;
      // The decoder just became available. Take the newest destination immediately,
      // without waiting an extra display frame or replaying intermediate seeks.
      seek(index, performance.now());
      wake();
    });
    video.addEventListener('error', () => { if (enabled && video.hasAttribute('src')) staticMode('video-error'); });
  });
  modeButton.addEventListener('click', () => {
    manualStatic = true;
    staticMode('manual');
    section.scrollIntoView({ behavior: 'instant' });
    section.querySelector('h1').focus({ preventScroll: true });
  });
  function preferenceChanged() {
    staticMode('preference-change');
    start();
  }
  reduced.addEventListener('change', preferenceChanged);
  connection?.addEventListener('change', preferenceChanged);
  window.addEventListener('scroll', wake, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else wake();
  });
  window.addEventListener('pageshow', () => {
    window.ScrollTrigger?.update();
    trigger?.refresh();
    wake();
  });
  start();
  const posterReady = section.querySelector('#hero-image').decode().catch(() => {});
  return { ready: Promise.all([posterReady, ready]) };
}
