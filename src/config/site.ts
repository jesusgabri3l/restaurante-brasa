export const SITE = {
  name: 'Brasa & Co.',
  description: 'Hamburguesas a las brasas. Demo de concepto de una web para restaurantes.',
  whatsapp: '573000000000', // ficticio: cambiar por el real
  whatsappMessage: 'Hola Brasa & Co., quiero hacer un pedido.',
  address: 'Cra. 53 # 79-120, Barranquilla',
  socials: [
    ['Instagram', '@brasa.baq'],
    ['TikTok', '@brasa.baq'],
    ['Facebook', 'Brasa & Co. Barranquilla'],
  ],
  hours: [
    ['Lunes a jueves', '12:00 – 22:00'],
    ['Viernes y sábado', '12:00 – 00:00'],
    ['Domingo', '12:00 – 21:00'],
  ],
} as const;

export const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(SITE.whatsappMessage)}`;

export const CREDIT_LINKS = [
  { label: 'GitHub', href: 'https://github.com/jesusgabri3l' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jesus-ahumada' },
  { label: 'Portfolio', href: 'https://jesusgabriel.dev/' },
] as const;
