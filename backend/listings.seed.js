/**
 * Seed data for the public catalog (the `listings` table).
 *
 * These 13 records are lifted verbatim from the original hardcoded cards in
 * frontend/index.html — this file is now the single source of truth for them.
 * Loaded once into SQLite when the table is empty (see db.js seedListingsIfEmpty).
 *
 * `kind`        : 'artist' | 'salon' | 'nail'  (which homepage section it belongs to)
 * `bookService` : the service string passed to the booking modal (openCal's 2nd arg)
 * `details`     : kind-specific extras (tags / salon chips / nail price lists)
 */
export const LISTINGS_SEED = [
  // ── Featured artists ──
  {
    kind: 'artist', name: 'Priya Mehta', city: 'Chandigarh', area: 'Sector 17',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop&crop=face',
    rating: 4.9, reviews: 128, priceFrom: 3500, available: true, bookService: 'Bridal',
    details: { tags: ['Bridal', 'Airbrush', 'HD'] },
  },
  {
    kind: 'artist', name: 'Simran Kaur', city: 'Mohali', area: 'Phase 10',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80&fit=crop&crop=face',
    rating: 4.8, reviews: 94, priceFrom: 2800, available: false, bookService: 'Party Makeup',
    details: { tags: ['Party', 'Natural', 'Korean'] },
  },
  {
    kind: 'artist', name: 'Anjali Sharma', city: 'Delhi', area: 'South Ex',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80&fit=crop&crop=face',
    rating: 5.0, reviews: 211, priceFrom: 5000, available: true, bookService: 'Bridal',
    details: { tags: ['Bridal', 'Editorial', 'HD'] },
  },
  {
    kind: 'artist', name: 'Neha Patel', city: 'Panchkula', area: null,
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80&fit=crop&crop=face',
    rating: 4.7, reviews: 67, priceFrom: 2200, available: false, bookService: 'Party Makeup',
    details: { tags: ['Party', 'Glow', 'Airbrush'] },
  },
  {
    kind: 'artist', name: 'Riya Batra', city: 'Delhi', area: 'Lajpat Nagar',
    image: 'https://images.unsplash.com/photo-1502767089025-6572583495f9?w=600&q=80&fit=crop&crop=face',
    rating: 4.9, reviews: 156, priceFrom: 4000, available: true, bookService: 'Bridal',
    details: { tags: ['Bridal', 'HD'] },
  },
  {
    kind: 'artist', name: 'Kavya Nair', city: 'Chandigarh', area: 'Sector 35',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80&fit=crop&crop=face',
    rating: 4.8, reviews: 89, priceFrom: 3200, available: false, bookService: 'Natural Look',
    details: { tags: ['Natural', 'Korean', 'Glow'] },
  },

  // ── Partner salons ──
  {
    kind: 'salon', name: 'Blush & Co. Studio', city: 'Chandigarh', area: 'Sector 22',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&fit=crop',
    rating: 4.9, reviews: null, priceFrom: null, available: false, bookService: 'Salon Service',
    details: {
      type: 'Full service salon', hours: 'Open 9am–8pm', artistsCount: 6,
      chips: ['Bridal ₹8,000+', 'Facial ₹800+', 'Nails ₹1,200+', 'Hair ₹600+'],
    },
  },
  {
    kind: 'salon', name: 'The Bridal Atelier', city: 'Mohali', area: 'Phase 7',
    image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80&fit=crop',
    rating: 4.8, reviews: null, priceFrom: null, available: false, bookService: 'Bridal Package',
    details: {
      type: 'Bridal specialist', hours: 'Open 8am–9pm', artistsCount: 4,
      chips: ['Bridal pkg ₹18,000+', 'Pre-bridal ₹2,500+', 'Airbrush ₹4,000+'],
    },
  },
  {
    kind: 'salon', name: 'Gloss Nail Studio', city: 'Chandigarh', area: 'Sector 9',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80&fit=crop',
    rating: 4.7, reviews: null, priceFrom: null, available: false, bookService: 'Nail Service',
    details: {
      type: 'Nail and beauty', hours: 'Open 10am–8pm', artistsCount: 3,
      chips: ['Acrylic ₹1,400+', 'Gel ₹1,200+', 'Nail art ₹80/nail'],
    },
  },
  {
    kind: 'salon', name: 'Radiance Beauty Bar', city: 'Panchkula', area: 'Sector 10',
    image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80&fit=crop',
    rating: 4.9, reviews: null, priceFrom: null, available: false, bookService: 'Skincare',
    details: {
      type: 'Skincare and glow', hours: 'Open 9am–7pm', artistsCount: 5,
      chips: ['Gold facial ₹1,800+', 'De-tan ₹700+', 'Body polish ₹2,500+'],
    },
  },

  // ── Nail specialists ──
  {
    kind: 'nail', name: 'Ritika Bose', city: 'Chandigarh', area: 'Sector 26',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&fit=crop',
    rating: 4.9, reviews: 76, priceFrom: 1000, available: false, bookService: 'Nail Extensions',
    details: {
      spec: 'Extension specialist', serviceMode: 'Home service',
      prices: [
        { name: 'Acrylic extensions', price: '₹1,200' },
        { name: 'Gel extensions', price: '₹1,000' },
        { name: 'Ombre extensions', price: '₹1,800' },
        { name: 'Nail art per nail', price: '₹80' },
      ],
    },
  },
  {
    kind: 'nail', name: 'Deepa Verma', city: 'Mohali', area: 'Phase 9',
    image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop',
    rating: 4.8, reviews: 54, priceFrom: 600, available: false, bookService: 'Nail Art',
    details: {
      spec: '3D nail art', serviceMode: 'Salon visit only',
      prices: [
        { name: '3D nail art', price: '₹150/nail' },
        { name: 'Gel polish full set', price: '₹600' },
        { name: 'Bridal nail package', price: '₹2,500' },
        { name: 'Stamping and foils', price: '₹900' },
      ],
    },
  },
  {
    kind: 'nail', name: 'Sunita Malik', city: 'Panchkula', area: 'Sector 8',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&fit=crop&crop=bottom',
    rating: 4.7, reviews: 41, priceFrom: 200, available: false, bookService: 'Nail Extensions',
    details: {
      spec: 'Extensions and repair', serviceMode: 'Home service',
      prices: [
        { name: 'Soft gel extensions', price: '₹1,000' },
        { name: 'Refill', price: '₹500' },
        { name: 'Chrome nails', price: '₹1,200' },
        { name: 'Nail removal', price: '₹200' },
      ],
    },
  },
];
