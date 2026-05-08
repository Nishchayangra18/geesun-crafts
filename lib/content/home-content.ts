import type { ArtistProfile, Testimonial } from "@/lib/types";

export const categories = [
  {
    title: "Abstract",
    description: "Expressive and emotional",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80",
    icon: "A",
  },
  {
    title: "Traditional",
    description: "Rich heritage, culture, and timeless",
    image: "https://images.unsplash.com/photo-1577083165633-14ebcdb0f658?auto=format&fit=crop&w=900&q=80",
    icon: "T",
  },
  {
    title: "Modern",
    description: "Serene, minimal, and stylish",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80",
    icon: "M",
  },
  {
    title: "Custom",
    description: "Personalized paintings tailored to you",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80",
    icon: "C",
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Neha Bansal",
    city: "Delhi",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    message:
      "The texture and finish feel museum-grade. It transformed our living room instantly.",
  },
  {
    id: "t2",
    name: "Rajat Iyer",
    city: "Bengaluru",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    message:
      "Packaging was excellent and the painting arrived exactly as shown. Premium experience end to end.",
  },
  {
    id: "t3",
    name: "Kavya Menon",
    city: "Kochi",
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
    message:
      "Geesun Crafts feels like a boutique gallery online. Loved the artist story and quality.",
  },
];

export const featuredArtist: ArtistProfile = {
  id: "a1",
  name: "Sunil Angra",
  title: "Featured Artist",
  bio: "Sunil Angra is a contemporary artist with over 25 years of experience, known for his abstract and semi-abstract works that blend emotion, texture, and visual harmony.",
  image:
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
};
