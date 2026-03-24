export type ProductSeed = {
  slug: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  style: string;
  medium: string;
  size: string;
  dimensions: string;
  artist: string;
  featured?: boolean;
  bestseller?: boolean;
  imagePath: string;
};

// Update imagePath values to your real local product images when available.
// Paths are resolved from the repository root.
export const PRODUCT_SEEDS: ProductSeed[] = [
  {
    slug: "lotus-dawn",
    title: "Lotus Dawn",
    description: "A serene floral composition with warm dawn tones.",
    price: 2499,
    quantity: 8,
    style: "Modern",
    medium: "Acrylic",
    size: "Medium",
    dimensions: "24 x 30 in",
    artist: "Geesun Studio",
    featured: true,
    bestseller: true,
    imagePath: "public/globe.svg",
  },
  {
    slug: "golden-courtyard",
    title: "Golden Courtyard",
    description: "Textured handcrafted artwork inspired by old city courtyards.",
    price: 3299,
    quantity: 5,
    style: "Traditional",
    medium: "Mixed Media",
    size: "Large",
    dimensions: "30 x 40 in",
    artist: "Geesun Studio",
    featured: true,
    imagePath: "public/window.svg",
  },
  {
    slug: "monsoon-memory",
    title: "Monsoon Memory",
    description: "Rain-washed palette with layered brushwork and depth.",
    price: 2899,
    quantity: 7,
    style: "Abstract",
    medium: "Oil on Canvas",
    size: "Medium",
    dimensions: "24 x 36 in",
    artist: "Geesun Studio",
    bestseller: true,
    imagePath: "public/file.svg",
  },
  {
    slug: "coastal-whisper",
    title: "Coastal Whisper",
    description: "Soft horizon strokes that bring a calm coastal mood indoors.",
    price: 3599,
    quantity: 4,
    style: "Modern",
    medium: "Watercolor",
    size: "Large",
    dimensions: "32 x 40 in",
    artist: "Geesun Studio",
    imagePath: "public/next.svg",
  },
  {
    slug: "earth-and-indigo",
    title: "Earth and Indigo",
    description: "A handcrafted color study balancing earthy and indigo tones.",
    price: 2199,
    quantity: 10,
    style: "Abstract",
    medium: "Acrylic",
    size: "Small",
    dimensions: "18 x 24 in",
    artist: "Geesun Studio",
    imagePath: "public/vercel.svg",
  },
];
