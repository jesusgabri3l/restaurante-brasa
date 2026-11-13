import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion';

// Flechas y puntos del carrusel móvil: sin autoplay, el scroll nativo manda.
function startMenuCarousels() {
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
  document.querySelectorAll<HTMLElement>('.menu__panel').forEach((panel) => {
    const grid = panel.querySelector<HTMLElement>('.menu__grid');
    const cards = Array.from(grid?.children ?? []) as HTMLElement[];
    const dots = Array.from(panel.querySelectorAll<HTMLElement>('[data-menu-dot]'));
    if (!grid) return;

    const offsetOf = (card: HTMLElement) => {
      const padding = parseFloat(getComputedStyle(grid).scrollPaddingLeft) || 0;
      return card.getBoundingClientRect().left - grid.getBoundingClientRect().left - padding;
    };
    const activeIndex = () => {
      if (grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 2) return cards.length - 1;
      const distances = cards.map((card) => Math.abs(offsetOf(card)));
      return distances.indexOf(Math.min(...distances));
    };
    const goTo = (index: number) => {
      const target = cards[Math.max(0, Math.min(cards.length - 1, index))];
      grid.scrollTo({ left: grid.scrollLeft + offsetOf(target), behavior });
    };

    grid.addEventListener(
      'scroll',
      () => {
        const active = activeIndex();
        dots.forEach((dot, i) => (i === active ? dot.setAttribute('aria-current', 'true') : dot.removeAttribute('aria-current')));
      },
      { passive: true },
    );
    panel.querySelector('[data-menu-prev]')?.addEventListener('click', () => goTo(activeIndex() - 1));
    panel.querySelector('[data-menu-next]')?.addEventListener('click', () => goTo(activeIndex() + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  });
}

export function startMenuTabs() {
  const tablist = document.querySelector<HTMLElement>('[data-menu-tabs]');
  if (!tablist) return;
  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll<HTMLElement>('.menu__panel'));
  startMenuCarousels();

  // Lazy dejaba las fotos de abajo y las de pestañas ocultas sin bajar hasta verlas (y compitiendo con los
  // cuadros del hero). Una pantalla antes del menú se piden todas y se decodifican, así ya están listas.
  const preloadImages = () =>
    document.querySelectorAll<HTMLImageElement>('.menu-card__image').forEach((image) => {
      image.loading = 'eager';
      image.fetchPriority = 'high';
      image.decode().catch(() => undefined);
    });
  ScrollTrigger.create({ trigger: '#menu', start: 'top 200%', once: true, onEnter: preloadImages });

  // Las cards aparecen escalonadas.
  const enterCards = (panel: HTMLElement) => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      panel.querySelectorAll('[data-menu-card]'),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out', overwrite: 'auto', clearProps: 'opacity,transform' },
    );
  };

  const selectTab = (selected: HTMLButtonElement, moveFocus = false) => {
    tabs.forEach((tab, index) => {
      const isSelected = tab === selected;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      panels[index].hidden = !isSelected;
      if (isSelected) enterCards(panels[index]);
    });
    if (moveFocus) selected.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      selectTab(tabs[(index + step + tabs.length) % tabs.length], true);
    });
  });

  // Entrada del primer panel al llegar a la sección con el scroll (una sola vez).
  const firstPanel = panels[0];
  if (!prefersReducedMotion()) {
    gsap.set(firstPanel.querySelectorAll('[data-menu-card]'), { opacity: 0 });
    ScrollTrigger.create({ trigger: firstPanel, start: 'top 75%', once: true, onEnter: () => enterCards(firstPanel) });
  }

  // Tilt suave al hover (solo con mouse).
  if (prefersReducedMotion()) return;
  document.querySelectorAll<HTMLElement>('[data-menu-card]').forEach((card) => {
    const image = card.querySelector<HTMLElement>('.menu-card__image');
    if (!image) return;
    // quickTo reutiliza un solo tween por propiedad: con gsap.to cada pointermove apilaba tweens nuevos.
    gsap.set(image, { transformPerspective: 600 });
    const rotateY = gsap.quickTo(image, 'rotationY', { duration: 0.4, ease: 'power3' });
    const rotateX = gsap.quickTo(image, 'rotationX', { duration: 0.4, ease: 'power3' });
    const rotate = gsap.quickTo(image, 'rotation', { duration: 0.4, ease: 'power3' });
    card.addEventListener('pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      rotateY(x * 14);
      rotateX(-y * 14);
      rotate(x * 4);
    });
    card.addEventListener('pointerleave', () => {
      rotateY(0);
      rotateX(0);
      rotate(0);
    });
  });
}
