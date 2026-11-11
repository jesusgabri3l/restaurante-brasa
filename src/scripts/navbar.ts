// El logo del navbar aparece al salir del hero.
export function startNavbarLogo() {
  const hero = document.querySelector<HTMLElement>('#top');
  const navbar = document.querySelector<HTMLElement>('[data-navbar]');
  if (!hero || !navbar) return;

  const observer = new IntersectionObserver(
    ([entry]) => navbar.toggleAttribute('data-past-hero', !entry.isIntersecting),
    { rootMargin: '-80px 0px 0px 0px' },
  );
  observer.observe(hero);
}
