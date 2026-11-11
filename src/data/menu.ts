export interface MenuItem {
  name: string;
  description: string;
  price: string;
  image: string; // archivo en public/images/menu
  alt: string;
  badge?: string; // etiqueta sutil bajo el precio, p. ej. producto estrella
}

export interface MenuCategory {
  id: string;
  label: string;
  items: MenuItem[];
}

export const MENU: MenuCategory[] = [
  {
    id: 'burgers',
    label: 'Burgers',
    items: [
      { name: 'La Brasa', description: 'Res, cheddar, tocineta, tomate, lechuga y salsa de la casa.', price: '$32.000', image: 'burger-1.webp', alt: 'Hamburguesa La Brasa', badge: 'La favorita de la casa' },
      { name: 'Doble Fuego', description: 'Doble carne, doble queso, cebolla caramelizada.', price: '$38.000', image: 'burger-2.webp', alt: 'Hamburguesa Doble Fuego' },
      { name: 'Ahumada', description: 'Res ahumada, queso azul, cebolla morada y rúgula.', price: '$35.000', image: 'burger-3.webp', alt: 'Hamburguesa Ahumada' },
      { name: 'Clásica', description: 'Res, queso, pepinillos, tomate y mostaza.', price: '$27.000', image: 'burger-4.webp', alt: 'Hamburguesa Clásica' },
      { name: 'Picante', description: 'Res, jalapeños, pepper jack y salsa de ají.', price: '$34.000', image: 'burger-5.webp', alt: 'Hamburguesa Picante' },
      { name: 'Pollo Crocante', description: 'Pollo apanado, repollo morado y mayo de limón.', price: '$30.000', image: 'burger-6.webp', alt: 'Hamburguesa de pollo crocante' },
    ],
  },
  {
    id: 'acompanantes',
    label: 'Acompañantes',
    items: [
      { name: 'Papas a la brasa', description: 'Con sal ahumada y alioli.', price: '$12.000', image: 'side-1.webp', alt: 'Papas a la brasa' },
      { name: 'Aros de cebolla', description: 'Apanados en cerveza, con salsa BBQ.', price: '$13.000', image: 'side-2.webp', alt: 'Aros de cebolla' },
    ],
  },
  {
    id: 'bebidas',
    label: 'Bebidas',
    items: [
      { name: 'Limonada de coco', description: 'Cremosa y bien fría.', price: '$11.000', image: 'drink-1.webp', alt: 'Limonada de coco' },
      { name: 'Malteada de vainilla', description: 'Helado artesanal, crema y cereza.', price: '$16.000', image: 'drink-2.webp', alt: 'Malteada de vainilla' },
    ],
  },
];

export const STORY_STATS = [
  { value: 2019, label: 'Desde', format: 'year' },
  { value: 48000, label: 'Burgers servidas', format: 'number' },
  { value: 12, label: 'Horas de brasa al día', format: 'number' },
] as const;
