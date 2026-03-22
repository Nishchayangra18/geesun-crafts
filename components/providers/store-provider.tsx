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

type CartApiItem = {
  id: string;
  product_id: string;
  quantity: number;
  product: Product | null;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const GUEST_CART_KEY = "geesun_cart";
const GUEST_WISHLIST_IDS_KEY = "geesun_guest_wishlist_ids";
const LEGACY_WISHLIST_KEY = "geesun_wishlist";

function getSafeStock(product: Product) {
  return Number.isFinite(product.quantity) ? Math.max(0, product.quantity) : 0;
}

function readGuestCartItems() {
  if (typeof window === "undefined") return [] as CartItem[];

  try {
    const saved = localStorage.getItem(GUEST_CART_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved) as Array<{
      product?: Product;
      quantity?: number;
    }>;

    if (!Array.isArray(parsed)) return [];

    const merged = new Map<string, CartItem>();
    for (const rawItem of parsed) {
      const product = rawItem?.product;
      if (!product?.id) continue;

      const qty = Number(rawItem.quantity ?? 0);
      if (!Number.isFinite(qty) || qty <= 0) continue;

      const available = getSafeStock(product);
      if (available <= 0) continue;

      const nextQuantity = Math.min(available, Math.trunc(qty));
      const existing = merged.get(product.id);
      if (!existing) {
        merged.set(product.id, {
          product,
          quantity: nextQuantity,
        });
      } else {
        merged.set(product.id, {
          product,
          quantity: Math.min(available, existing.quantity + nextQuantity),
        });
      }
    }

    return [...merged.values()];
  } catch {
    return [];
  }
}

function writeGuestCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCartItems() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_KEY);
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

function normalizeCartItems(items: CartApiItem[]) {
  return items.reduce<CartItem[]>((acc, item) => {
    const quantity = Number(item.quantity);
    if (!item.product?.id || !Number.isFinite(quantity) || quantity <= 0) {
      return acc;
    }

    acc.push({
      cartItemId: String(item.id),
      product: item.product,
      quantity,
    });
    return acc;
  }, []);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => readGuestCartItems());
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => readGuestWishlistIds());
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail) {
      writeGuestCartItems(cart);
    }
  }, [cart, userEmail]);

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

  const fetchServerCart = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setCart(readGuestCartItems());
      return;
    }

    const response = await fetch("/api/cart", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) throw new Error("Failed to fetch cart");

    const payload = await response.json();
    setCart(normalizeCartItems((payload.items ?? []) as CartApiItem[]));
  }, [getAccessToken]);

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

  const mergeGuestCartIntoServer = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;

    const guestItems = readGuestCartItems();
    if (!guestItems.length) return;

    for (const item of guestItems) {
      const productId = String(item.product.id ?? "").trim();
      if (!productId) continue;

      await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: item.quantity,
        }),
      }).catch(() => null);
    }

    clearGuestCartItems();
  }, [getAccessToken]);

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

  const refreshCart = useCallback(async () => {
    try {
      await fetchServerCart();
    } catch {
      setCart(readGuestCartItems());
    }
  }, [fetchServerCart]);

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
        await mergeGuestCartIntoServer();
      }

      await Promise.all([refreshWishlist(), refreshCart()]);
    };

    void syncUserState();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);

      if (session?.user) {
        void (async () => {
          await mergeGuestWishlistIntoServer();
          await mergeGuestCartIntoServer();
          await Promise.all([refreshWishlist(), refreshCart()]);
        })();
        return;
      }

      const guestIds = readGuestWishlistIds();
      setWishlistIds(guestIds);
      setCart(readGuestCartItems());
      void fetchGuestWishlistProducts(guestIds);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [fetchGuestWishlistProducts, mergeGuestCartIntoServer, mergeGuestWishlistIntoServer, refreshCart, refreshWishlist]);

  useEffect(() => {
    if (!userEmail) return;
    const interval = window.setInterval(() => {
      void Promise.all([refreshWishlist(), refreshCart()]);
    }, 60000);
    return () => window.clearInterval(interval);
  }, [refreshCart, refreshWishlist, userEmail]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void Promise.all([refreshWishlist(), refreshCart()]);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refreshCart, refreshWishlist]);

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      wishlist,
      userEmail,
      cartCount: cart.reduce((count, item) => count + item.quantity, 0),
      wishlistCount: wishlistIds.length,
      addToCart: (product) => {
        const productId = String(product.id ?? "").trim();
        if (!productId) return;

        const stock = getSafeStock(product);
        if (stock <= 0) {
          setToastMessage("This product is currently out of stock.");
          return;
        }

        if (userEmail) {
          void (async () => {
            const token = await getAccessToken();
            if (!token) return;

            const response = await fetch("/api/cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                product_id: productId,
                quantity: 1,
              }),
            });

            if (!response.ok) {
              const payload = await response.json().catch(() => ({}));
              setToastMessage(payload?.error ?? "Could not add to cart.");
              await refreshCart();
              return;
            }

            setToastMessage("Added to cart.");
            await refreshCart();
          })();
          return;
        }

        setCart((current) => {
          const index = current.findIndex((item) => item.product.id === product.id);
          if (index > -1) {
            return current.map((item, itemIndex) =>
              itemIndex !== index
                ? item
                : {
                    ...item,
                    quantity: Math.min(getSafeStock(item.product), item.quantity + 1),
                  },
            );
          }
          return [...current, { product, quantity: 1 }];
        });

        setToastMessage("Added to guest cart. Login to sync across devices.");
      },
      removeFromCart: (productId) => {
        setCart((current) => current.filter((item) => item.product.id !== productId));

        if (userEmail) {
          void (async () => {
            const token = await getAccessToken();
            if (!token) return;

            const existing = cart.find((item) => item.product.id === productId);
            if (!existing?.cartItemId) {
              await refreshCart();
              return;
            }

            const response = await fetch(`/api/cart/${existing.cartItemId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              const payload = await response.json().catch(() => ({}));
              setToastMessage(payload?.error ?? "Could not remove cart item.");
              await refreshCart();
              return;
            }

            setToastMessage("Removed from cart.");
            await refreshCart();
          })();
        }
      },
      updateCartQuantity: (productId, quantity) => {
        const existing = cart.find((item) => item.product.id === productId);
        if (!existing) return;

        if (quantity <= 0) {
          setCart((current) => current.filter((item) => item.product.id !== productId));

          if (userEmail) {
            void (async () => {
              const token = await getAccessToken();
              if (!token || !existing.cartItemId) return;
              await fetch(`/api/cart/${existing.cartItemId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }).catch(() => null);
              await refreshCart();
            })();
          }

          return;
        }

        const cappedQuantity = Math.min(Math.max(1, quantity), Math.max(1, getSafeStock(existing.product)));

        setCart((current) =>
          current.map((item) =>
            item.product.id === productId
              ? {
                  ...item,
                  quantity: cappedQuantity,
                }
              : item,
          ),
        );

        if (userEmail) {
          void (async () => {
            const token = await getAccessToken();
            if (!token || !existing.cartItemId) return;

            const response = await fetch(`/api/cart/${existing.cartItemId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ quantity: cappedQuantity }),
            });

            if (!response.ok) {
              const payload = await response.json().catch(() => ({}));
              setToastMessage(payload?.error ?? "Could not update cart quantity.");
              await refreshCart();
              return;
            }

            await refreshCart();
          })();
        }
      },
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

        const stock = getSafeStock(entry.product);
        setCart((current) => {
          const index = current.findIndex((item) => item.product.id === productId);
          if (index > -1) {
            return current.map((item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    quantity: Math.min(item.quantity + 1, Math.max(1, stock)),
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
            await fetch("/api/cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ product_id: productId, quantity: 1 }),
            }).catch(() => null);
            await Promise.all([refreshWishlist(), refreshCart()]);
          })();
        } else {
          const nextGuestIds = readGuestWishlistIds().filter((id) => id !== productId);
          writeGuestWishlistIds(nextGuestIds);
        }

        setToastMessage("Moved to cart.");
      },
      isWishlisted: (productId) => wishlistIds.includes(productId),
      clearCart: () => {
        setCart([]);

        if (userEmail) {
          void (async () => {
            const token = await getAccessToken();
            if (!token) return;

            await fetch("/api/cart", {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }).catch(() => null);

            await refreshCart();
          })();
          return;
        }

        clearGuestCartItems();
      },
      refreshWishlist,
    }),
    [cart, getAccessToken, refreshCart, refreshWishlist, userEmail, wishlist, wishlistIds],
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
