const menu = document.querySelector('#mobile-menu');
const toggle = document.querySelector('.menu-toggle');
function initNavigation() {
  toggle.addEventListener('click', () => { menu.showModal(); toggle.setAttribute('aria-expanded', 'true'); });
  const close = () => menu.close();
  menu.querySelector('.menu-close').addEventListener('click', close);
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  menu.addEventListener('close', () => { toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); });
  const header = document.querySelector('#header');
  const update = () => header.classList.toggle('scrolled', window.scrollY > 25);
  window.addEventListener('scroll', update, { passive: true }); update();
}
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const CONFIG = { revealDuration: 0.85, loaderTimeout: 1800, desktop: 1024 };

async function initPreloader() {
  const loader = document.querySelector('.preloader');
  if (reducedMotion.matches) return;
  loader.hidden = false;
  const hero = document.querySelector('#hero-image');
  await Promise.race([hero.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, CONFIG.loaderTimeout))]);
  loader.hidden = true;
}

function initHeroAnimations() {
  gsap.from('.hero-enter', { opacity: 0, y: 24, duration: 1, stagger: 0.12, ease: 'power2.out', clearProps: 'all' });
  gsap.from('.hero-photo', { opacity: 0, scale: 0.96, duration: 1.4, ease: 'power2.out', clearProps: 'all' });
}

function initEditorialMotion() {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    document.querySelectorAll('.reveal').forEach(el => {
      gsap.from(el, { y: 35, opacity: 0, duration: CONFIG.revealDuration, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true }, clearProps: 'all' });
    });
    document.querySelectorAll('.step-line').forEach(el => gsap.from(el, { scaleX: 0, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 94%', once: true } }));
  });
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.to('.hero-photo img', { scale: 1.1, yPercent: 3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
    gsap.to('.hero-copy', { y: -45, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
    gsap.fromTo('.nature-photo', { y: 40, scale: 0.93 }, { y: -20, scale: 1, ease: 'none', scrollTrigger: { trigger: '.nature', start: 'top 85%', end: 'bottom bottom', scrub: 1 } });
    gsap.from('.nature-photo picture', { clipPath: 'inset(7% 10% 7% 10% round 120px)', ease: 'none', scrollTrigger: { trigger: '.nature-photo', start: 'top 85%', end: 'top 25%', scrub: 1 } });
    gsap.to('.pack-small', { y: -45, rotation: 2, ease: 'none', scrollTrigger: { trigger: '.packaging', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    gsap.from('.featured-photo img', { scale: 1.07, ease: 'none', scrollTrigger: { trigger: '.featured', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  });
  return mm;
}

function initSensory(mm) {
  mm.add('(min-width: 1024px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)', () => {
    const stage = document.querySelector('.sensory-stage');
    const scenes = gsap.utils.toArray('.sensory-scene');
    stage.classList.add('is-pinned');
    gsap.set(scenes.slice(1), { autoAlpha: 0 });
    const story = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 82px', end: '+=190%', scrub: 0.8, pin: true, invalidateOnRefresh: true } });
    scenes.slice(1).forEach((scene, i) => {
      story.to(scenes[i], { autoAlpha: 0, duration: 0.7 }, i + 0.4)
        .to(scene, { autoAlpha: 1, duration: 0.7 }, i + 0.4)
        .from(scene.querySelector('h3'), { y: 40, duration: 0.8 }, i + 0.4);
    });
    return () => stage.classList.remove('is-pinned');
  });
}

function initHorizontalCollection(mm) {
  const section = document.querySelector('.collection');
  const viewport = document.querySelector('.collection-window');
  const track = document.querySelector('.collection-track');
  const products = [...document.querySelectorAll('.product')];
  const prev = document.querySelector('#collection-prev');
  const next = document.querySelector('#collection-next');
  const counter = document.querySelector('.collection-counter');
  let active = 0;
  let scrollTween;
  const setActive = index => {
    active = Math.max(0, Math.min(products.length - 1, index));
    prev.disabled = active === 0; next.disabled = active === products.length - 1;
    counter.textContent = `0${active + 1} — 03`;
  };
  const navigate = delta => {
    const index = Math.max(0, Math.min(products.length - 1, active + delta));
    if (scrollTween) {
      const st = scrollTween.scrollTrigger;
      window.scrollTo({ top: st.start + (st.end - st.start) * index / (products.length - 1), behavior: 'smooth' });
    } else {
      viewport.scrollTo({ left: (viewport.scrollWidth - viewport.clientWidth) * index / (products.length - 1), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }
    setActive(index);
  };
  prev.addEventListener('click', () => navigate(-1));
  next.addEventListener('click', () => navigate(1));
  track.addEventListener('focusin', event => {
    if (!scrollTween) return;
    const product = event.target.closest('.product');
    if (!product) return;
    const index = products.indexOf(product);
    if (index !== active) navigate(index - active);
  });
  viewport.addEventListener('scroll', () => {
    if (!scrollTween) {
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      setActive(maxScroll > 0 ? Math.round(viewport.scrollLeft / maxScroll * (products.length - 1)) : 0);
    }
  }, { passive: true });
  setActive(0);
  if (!mm) return;
  mm.add('(min-width: 1024px) and (min-height: 900px) and (prefers-reduced-motion: no-preference)', () => {
    viewport.scrollLeft = 0;
    viewport.classList.add('is-pinned');
    section.classList.add('is-sticky');
    const distance = () => track.scrollWidth - viewport.clientWidth + parseFloat(getComputedStyle(viewport).paddingLeft) * 2;
    scrollTween = gsap.to(track, { x: () => -distance(), ease: 'none', scrollTrigger: { trigger: section, start: 'top 82px', end: () => `+=${distance()}`, pin: true, scrub: 0.7, invalidateOnRefresh: true, onUpdate: self => setActive(Math.round(self.progress * (products.length - 1))) } });
    return () => { scrollTween = null; viewport.classList.remove('is-pinned'); section.classList.remove('is-sticky'); setActive(0); };
  });
}

async function init() {
  initNavigation();
  await initPreloader();
  if (!window.gsap || !window.ScrollTrigger) { initHorizontalCollection(null); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (!reducedMotion.matches) initHeroAnimations();
  const mm = initEditorialMotion();
  initSensory(mm);
  initHorizontalCollection(mm);
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
init();
