function createAvatarImage(name, backgroundColor) {
  const initials = name
    .split(' ')
    .map((segment) => segment[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" fill="${backgroundColor}" rx="48" />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="35" font-family="Geologica, sans-serif" font-weight="700">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const shopperLocation = {
  label: 'Mission District, San Francisco',
  lat: 37.7599,
  lng: -122.4148,
};

export const tripSeed = [
  {
    id: 'costco-mission',
    driver: {
      name: 'James Olaitan',
      photo: createAvatarImage('James Olaitan', '#4d216a'),
      rating: 4.9,
      vehicle: 'Gray Honda CR-V',
      locationLabel: 'Mission District, Valencia St',
    },
    driverLocation: { lat: 37.7598, lng: -122.421 },
    pickupLocation: null,
    pickupTime: 'Saturday, March 14 • 5:30 PM',
    items: [
      { id: 'rice', name: 'Kirkland Rice 25lb', availableQty: 3, unit: 'shares', unitPrice: 6.25 },
      { id: 'chicken', name: 'Chicken Breasts', availableQty: 2, unit: 'shares', unitPrice: 8.5 },
      { id: 'eggs', name: 'Organic Eggs 24-pack', availableQty: 4, unit: 'shares', unitPrice: 3.75 },
    ],
  },
  {
    id: 'sams-soma',
    driver: {
      name: 'Chikamso Adireje',
      photo: createAvatarImage('Chikamso Adireje', '#2f6f73'),
      rating: 4.8,
      vehicle: 'White Toyota Corolla',
      locationLabel: 'SoMa, 4th & King',
    },
    driverLocation: { lat: 37.7767, lng: -122.3948 },
    pickupLocation: { label: 'Yerba Buena Gardens pickup point', lat: 37.784, lng: -122.4024 },
    pickupTime: 'Sunday, March 15 • 11:00 AM',
    items: [
      { id: 'yogurt', name: 'Greek Yogurt Variety Pack', availableQty: 5, unit: 'cups', unitPrice: 1.8 },
      { id: 'avocados', name: 'Avocado Bag', availableQty: 3, unit: 'shares', unitPrice: 4.4 },
      { id: 'spinach', name: 'Baby Spinach Clamshell', availableQty: 4, unit: 'shares', unitPrice: 2.1 },
    ],
  },
  {
    id: 'costco-sunset',
    driver: {
      name: 'Johnbosco Ochije',
      photo: createAvatarImage('Johnbosco Ochije', '#6f3b8f'),
      rating: 4.7,
      vehicle: 'Blue Subaru Outback',
      locationLabel: 'Inner Sunset, 9th Ave',
    },
    driverLocation: { lat: 37.7641, lng: -122.4661 },
    pickupLocation: null,
    pickupTime: 'Monday, March 16 • 6:15 PM',
    items: [
      { id: 'salmon', name: 'Atlantic Salmon Fillets', availableQty: 2, unit: 'shares', unitPrice: 12.75 },
      { id: 'broccoli', name: 'Broccoli Florets', availableQty: 6, unit: 'bags', unitPrice: 2.65 },
      { id: 'bananas', name: 'Organic Bananas', availableQty: 8, unit: 'bundles', unitPrice: 1.4 },
    ],
  },
];
