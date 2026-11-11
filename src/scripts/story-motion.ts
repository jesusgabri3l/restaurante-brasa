import { gsap } from 'gsap';
import { prefersReducedMotion } from './motion';

const formatValue = (value: number, format: string | undefined) =>
  format === 'year' ? String(Math.round(value)) : Math.round(value).toLocaleString('es-CO');

export function startStoryMotion() {
  // Con movimiento reducido el video de la parrilla queda en su póster.
  if (prefersReducedMotion()) return;

  // El video (~900 KB) solo se descarga y reproduce cerca de pantalla: con autoplay competía con BRASA (LCP).
  const videoObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach(({ target, isIntersecting }) => {
        const video = target as HTMLVideoElement;
        // iOS con ahorro de batería bloquea el autoplay: queda el póster y se reintenta con el primer toque.
        if (isIntersecting)
          video.play().catch(() => {
            const retry = () => video.play().catch(() => undefined);
            document.addEventListener('touchend', retry, { once: true });
            document.addEventListener('click', retry, { once: true });
          });
        else video.pause();
      }),
    { rootMargin: '200px 0px' },
  );
  document.querySelectorAll<HTMLVideoElement>('[data-loop-video]').forEach((video) => videoObserver.observe(video));

  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((photo) => {
    gsap.fromTo(
      photo,
      { yPercent: -8 },
      { yPercent: 8, ease: 'none', scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });

  // El queso se estira desde el borde con el scroll.
  gsap.fromTo(
    '[data-drip]',
    { scaleY: 1, transformOrigin: 'top center' },
    { scaleY: 1.25, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'top 20%', scrub: true } },
  );

  // El sello gira lento ligado al scroll.
  gsap.to('[data-seal]', {
    rotation: 360,
    ease: 'none',
    transformOrigin: '50% 50%',
    scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((element) => {
    const target = Number(element.dataset.count);
    const counter = { value: 0 };
    element.textContent = formatValue(0, element.dataset.format);
    gsap.to(counter, {
      value: target,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => (element.textContent = formatValue(counter.value, element.dataset.format)),
      scrollTrigger: { trigger: element, start: 'top 85%', once: true },
    });
  });
}
