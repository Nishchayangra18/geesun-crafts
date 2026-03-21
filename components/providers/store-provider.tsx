"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type WishlistEntry = {
  productId: string;
  createdAt?: string;
  product: Product | null;
};

type StoreContextValue = {
  cart: CartItem[];
  wishlist: WishlistEntry[];
  userEmail: string | null;
  cartCount: number;
  wishlistCount: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  moveWishlistToCart: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clearCart: () => void;
  refreshWishlist: () => Promise<void>;
};

type WishlistApiItem = {
  product_id: string;
  created_at?: string;
  product: Product | null;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_KEY = "geesun_cart";
const GUEST_WISHLIST_IDS_KEY = "geesun_guest_wishlist_ids";
const LEGACY_WISHLIST_KEY = "geesun_wishlist";

function getSafeStock(product: Product) {
  return Number.isFinite(product.quantity) ? Math.max(0, product.quantity) : 0;
}

function readGuestWishlistIds() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const saved = localStorage.getItem(GUEST_WISHLIST_IDS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return [...new Set(parsed.map((id) => String(id).trim()).filter(Boolean))];
    }

    const legacy = localStorage.getItem(LEGACY_WISHLIST_KEY);
    if (!legacy) return [];
    const parsedLegacy = JSON.parse(legacy);
    if (!Array.isArray(parsedLegacy)) return [];

    const ids = [
      ...new Set(
        parsedLegacy
          .map((entry) => String((entry as { id?: string })?.id ?? "").trim())
          .filter(Boolean),
      ),
    ];
    if (ids.length) {
      localStorage.setItem(GUEST_WISHLIST_IDS_KEY, JSON.stringify(ids));
    }
    localStorage.removeItem(LEGACY_WISHLIST_KEY);
    return ids;
  } catch {
    return [];
  }
}

function writeGuestWishlistIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_WISHLIST_IDS_KEY, JSON.stringify(ids));
}

function clearGuestWishlistIds() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_WISHLIST_IDS_KEY);
}

function normalizeWishlistItems(items: WishlistApiItem[]) {
  return items.map((item) => ({
    productId: String(item.product_id),
    createdAt: item.created_at,
    product: item.product,
  }));
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
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => readGuestWishlistIds());
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.removeItem(LEGACY_WISHLIST_KEY);
  }, []);

  useEffect(() => {
    const timer = toastMessage
      ? window.setTimeout(() => setToastMessage(null), 2200)
      : undefined;
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [toastMessage]);

  const getAccessToken = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const fetchGuestWishlistProducts = useCallback(async (ids: string[]) => {
    if (!ids.length) {
      setWishlist([]);
      return;
    }

    try {
      const response = await fetch("/api/products", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load products");
      const payload = await response.json();
      const products = (payload.products ?? []) as Product[];
      const productMap = new Map(products.map((product) => [product.id, product]));

      setWishlist(
        ids.map((id) => ({
          productId: id,
          product: productMap.get(id) ?? null,
        })),
      );
    } catch {
      setWishlist(ids.map((id) => ({ productId: id, product: null })));
    }
  }, []);

  const fetchServerWishlist = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      const guestIds = readGuestWishlistIds();
      setWishlistIds(guestIds);
      await fetchGuestWishlistProducts(guestIds);
      return;
    }

    const response = await fetch("/api/wishlist", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to fetch wishlist");

    const payload = await response.json();
    const items = normalizeWishlistItems((payload.items ?? []) as WishlistApiItem[]);
    setWishlist(items);
    setWishlistIds(items.map((item) => item.productId));
  }, [fetchGuestWishlistProducts, getAccessToken]);

  const mergeGuestWishlistIntoServer = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;

    const guestIds = readGuestWishlistIds();
    if (!guestIds.length) return;

    await Promise.all(
      guestIds.map((productId) =>
        fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: productId }),
        }).catch(() => null),
      ),
    );

    clearGuestWishlistIds();
  }, [getAccessToken]);

  const refreshWishlist = useCallback(async () => {
    try {
      await fetchServerWishlist();
    } catch {
      const guestIds = readGuestWishlistIds();
      setWishlistIds(guestIds);
      await fetchGuestWishlistProducts(guestIds);
    }
  }, [fetchGuestWishlistProducts, fetchServerWishlist]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;

    const syncUserState = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;

      setUserEmail(user?.email ?? null);

      if (user) {
        await mergeGuestWishlistIntoServer();
      }
      await refreshWishlist();
    };

    void syncUserState();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);

      if (session?.user) {
        void (async () => {
          await mergeGuestWishlistIntoServer();
          await refreshWishlist();
        })();
        return;
      }

      const guestIds = readGuestWishlistIds();
      setWishlistIds(guestIds);
      void fetchGuestWishlistProducts(guestIds);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [fetchGuestWishlistProducts, mergeGuestWishlistIntoServer, refreshWishlist]);

  useEffect(() => {
    if (!userEmail) return;
    const interval = window.setInterval(() => {
      void refreshWishlist();
    }, 60000);
    return () => window.clearInterval(interval);
  }, [refreshWishlist, userEmail]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshWishlist();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refreshWishlist]);

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      wishlist,
      userEmail,
      cartCount: cart.reduce((count, item) => count + item.quantity, 0),
      wishlistCount: wishlistIds.length,
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
      addToWishlist: (product) => {
        const productId = String(product.id);
        if (!productId) return;
        if (wishlistIds.includes(productId)) return;

        setWishlistIds((current) => [...current, productId]);
        setWishlist((current) => [
          {
            productId,
            product,
          },
          ...current.filter((item) => item.productId !== productId),
        ]);

        if (userEmail) {
          void (async () => {
            const token = await getAccessToken();
            if (!token) return;
            const response = await fetch("/api/wishlist", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ product_id: productId }),
            });

            if (!response.ok) {
              setToastMessage("Could not add to wishlist.");
              await refreshWishlist();
              return;
            }

            setToastMessage("Added to wishlist.");
            await refreshWishlist();
          })();
          return;
        }

        const nextGuestIds = [...new Set([...readGuestWishlistIds(), productId])];
        writeGuestWishlistIds(nextGuestIds);
        setToastMessage("Saved to guest wishlist. Login to sync across devices.");
      },
      removeFromWishlist: (productId) => {
        setWishlistIds((current) => current.filter((id) => id !== productId));
        setWishlist((current) => current.filter((item) => item.productId !== productId));

        if (userEmail) {
          void (async () => {
            const token = await getAccessToken();
            if (!token) return;
            const response = await fetch(`/api/wishlist/${productId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              setToastMessage("Could not remove from wishlist.");
              await refreshWishlist();
              return;
            }

            setToastMessage("Removed from wishlist.");
            await refreshWishlist();
          })();
          return;
        }

        const nextGuestIds = readGuestWishlistIds().filter((id) => id !== productId);
        writeGuestWishlistIds(nextGuestIds);
        setToastMessage("Removed from guest wishlist.");
      },
      moveWishlistToCart: (productId) => {
        const entry = wishlist.find((item) => item.productId === productId);
        if (!entry?.product) {
          setToastMessage("This product is unavailable.");
          return;
        }
        if (getSafeStock(entry.product) <= 0) {
          setToastMessage("This product is currently out of stock.");
          return;
        }

        setCart((current) => {
          const index = current.findIndex((item) => item.product.id === productId);
          if (index > -1) {
            return current.map((item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    quantity: Math.min(
                      item.quantity + 1,
                      Math.max(1, getSafeStock(entry.product as Product)),
                    ),
                  }
                : item,
            );
          }
          return [...current, { product: entry.product as Product, quantity: 1 }];
        });

        setWishlistIds((current) => current.filter((id) => id !== productId));
        setWishlist((current) => current.filter((item) => item.productId !== productId));

        if (userEmail) {
          void (async () => {
            const token = await getAccessToken();
            if (!token) return;
            await fetch(`/api/wishlist/${productId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            await refreshWishlist();
          })();
        } else {
          const nextGuestIds = readGuestWishlistIds().filter((id) => id !== productId);
          writeGuestWishlistIds(nextGuestIds);
        }

        setToastMessage("Moved to cart.");
      },
      isWishlisted: (productId) => wishlistIds.includes(productId),
      clearCart: () => setCart([]),
      refreshWishlist,
    }),
    [cart, getAccessToken, refreshWishlist, userEmail, wishlist, wishlistIds],
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      {toastMessage ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--text-primary)] px-4 py-2 text-xs text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return context;
}
