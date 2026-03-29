export type ArtStyle = string;
export type ArtMedium = string;
export type ArtSize = string;

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  galleryImages: string[];
  price: number;
  quantity: number;
  maxQuantity: number;
  createdAt?: string;
  originalPrice?: number;
  rating: number;
  articleCode: string;
  setType: string;
  frame: string;
  style: ArtStyle;
  medium: ArtMedium;
  size: ArtSize;
  dimensions: string;
  artist: string;
  featured?: boolean;
  bestseller?: boolean;
};

export type CartItem = {
  cartItemId?: string;
  product: Product;
  quantity: number;
};

export type Testimonial = {
  id: string;
  name: string;
  city: string;
  message: string;
};

export type ArtistProfile = {
  id: string;
  name: string;
  title: string;
  bio: string;
  image: string;
};

export type EventType =
  | "order_created"
  | "user_registered"
  | "payment_success"
  | "cart_updated";

export type EventPayload = Record<string, unknown>;
