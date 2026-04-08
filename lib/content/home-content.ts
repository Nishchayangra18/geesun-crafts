import type { ArtistProfile, Testimonial } from "@/lib/types";

export const categories = [
  { title: "Abstract", description: "Bold textures and emotional strokes." },
  { title: "Traditional", description: "Cultural narratives in timeless form." },
  { title: "Modern", description: "Curated minimal pieces for refined spaces." },
  { title: "Custom", description: "Commission paintings tailored to your vision." },
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Neha Bansal",
    city: "Delhi",
    message:
      "The texture and finish feel museum-grade. It transformed our living room instantly.",
  },
  {
    id: "t2",
    name: "Rajat Iyer",
    city: "Bengaluru",
    message:
      "Packaging was excellent and the painting arrived exactly as shown. Premium experience end to end.",
  },
  {
    id: "t3",
    name: "Kavya Menon",
    city: "Kochi",
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
