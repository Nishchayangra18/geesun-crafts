"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type StoreContextValue = {
  cart: CartItem[];
  wishlist: Product[];
  userEmail: string | null;
  cartCount: number;
  wishlistCount: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_KEY = "geesun_cart";
const WISHLIST_KEY = "geesun_wishlist";

function getSafeStock(product: Product) {
  return Number.isFinite(product.quantity) ? Math.max(0, product.quantity) : 0;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      return saved ? (JSON.parse(saved) as Product[]) : [];
    } catch {
      return [];
    }
  });
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      wishlist,
      userEmail,
      cartCount: cart.reduce((count, item) => count + item.quantity, 0),
      wishlistCount: wishlist.length,
      addToCart: (product) =>
        setCart((current) => {
          const incomingStock = getSafeStock(product);
          if (incomingStock <= 0) return current;
          const index = current.findIndex((item) => item.product.id === product.id);
          if (index > -1) {
            return current.map((item, itemIndex) =>
              itemIndex !== index
                ? item
                : (() => {
                    const stock = getSafeStock(item.product);
                    if (stock <= 0 || item.quantity >= stock) return item;
                    return { ...item, quantity: item.quantity + 1 };
                  })(),
            );
          }
          return [...current, { product, quantity: 1 }];
        }),
      removeFromCart: (productId) =>
        setCart((current) => current.filter((item) => item.product.id !== productId)),
      updateCartQuantity: (productId, quantity) =>
        setCart((current) =>
          current
            .map((item) =>
              item.product.id === productId
                ? {
                    ...item,
                    quantity:
                      getSafeStock(item.product) <= 0
                        ? 0
                        : Math.min(Math.max(1, quantity), getSafeStock(item.product)),
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
        ),
      addToWishlist: (product) =>
        setWishlist((current) =>
          current.some((item) => item.id === product.id) ? current : [...current, product],
        ),
      removeFromWishlist: (productId) =>
        setWishlist((current) => current.filter((item) => item.id !== productId)),
      isWishlisted: (productId) => wishlist.some((product) => product.id === productId),
      clearCart: () => setCart([]),
    }),
    [cart, wishlist, userEmail],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return context;
}
