// Customer configuration constants
export const CUSTOMER_EMOJIS = ['😊', '😄', '😃', '🙂', '😌', '😋', '🤔', '😎'];

// Customer spawn and positioning
export const CUSTOMER_SPAWN_AREA = {
  x: { min: 50, max: 350 },
  y: { min: 50, max: 250 }
};

// Service capacity limits
export const MAX_CUSTOMER_CAPACITY = 2; // maximum customers that can be served simultaneously

// Uniform patience for all customers (in seconds)
export const DEFAULT_PATIENCE_SECONDS = 12;

// Customer avatar images (future: replace with sprite sheets). 32x32 recommended.

export const CUSTOMER_IMAGES: string[] = [
  '/images/customer/customer1.png',
  '/images/customer/customer2.png',
  '/images/customer/customer3.png',
  '/images/customer/customer4.png',
  '/images/customer/customer5.png',
  '/images/customer/customer6.png',
  '/images/customer/customer7.png',
  '/images/customer/customer8.png',
  '/images/customer/customer9.png',
  '/images/customer/customer10.png',
];

// Default fallback image (must exist in public)
export const DEFAULT_CUSTOMER_IMAGE = '/images/customer/customer1.png';
