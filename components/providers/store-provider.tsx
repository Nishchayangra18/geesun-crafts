"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  addToCart: (product: Product) => Promise<CartActionResult>;
  removeFromCart: (productId: string) => Promise<CartActionResult>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<CartActionResult>;
  addToWishlist: (product: Product) => Promise<WishlistActionResult>;
  removeFromWishlist: (productId: string) => void;
  moveWishlistToCart: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clearCart: () => void;
  refreshWishlist: () => Promise<void>;
};

export type CartActionResult = {
  ok: boolean;
  code:
    | "added"
    | "updated"
    | "removed"
    | "stock_limit"
    | "out_of_stock"
    | "unauthorized"
    | "invalid"
    | "error";
  message: string;
  available?: number;
  quantity?: number;
};

type WishlistActionResult = {
  ok: boolean;
  code: "added" | "already_wishlisted" | "unauthorized" | "error";
  message: string;
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

type RefreshOptions = {
  force?: boolean;
};

const REFRESH_THROTTLE_MS = 3000;

const StoreContext = createContext<StoreContextValue | null>(null);

const GUEST_CART_KEY = "geesun_cart";
const GUEST_WISHLIST_IDS_KEY = "geesun_guest_wishlist_ids";
const LEGACY_WISHLIST_KEY = "geesun_wishlist";

function getSafeStock(product: Product) {
  return Number.isFinite(product.quantity) ? Math.max(0, product.quantity) : 0;
}

function getStockLimitMessage(remaining: number) {
  if (remaining > 0) return `Only ${remaining} items available`;
  return "Maximum available stock reached";
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
  const cartRefreshInFlightRef = useRef<Promise<void> | null>(null);
  const wishlistRefreshInFlightRef = useRef<Promise<void> | null>(null);
  const lastCartRefreshAtRef = useRef(0);
  const lastWishlistRefreshAtRef = useRef(0);

  useEffect(() => {
    if (!userEmail) {
      writeGuestCartItems(cart);
    }
  }, [cart, userEmail]);

  useEffect(() => {
    localStorage.removeItem(LEGACY_WISHLIST_KEY);
  }, []);

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

  const refreshWishlist = useCallback(
    async (options: RefreshOptions = {}) => {
      const now = Date.now();
      if (!options.force && now - lastWishlistRefreshAtRef.current < REFRESH_THROTTLE_MS) {
        return wishlistRefreshInFlightRef.current ?? Promise.resolve();
      }
      if (wishlistRefreshInFlightRef.current) return wishlistRefreshInFlightRef.current;

      wishlistRefreshInFlightRef.current = (async () => {
        try {
          await fetchServerWishlist();
          lastWishlistRefreshAtRef.current = Date.now();
        } catch {
          const guestIds = readGuestWishlistIds();
          setWishlistIds(guestIds);
          await fetchGuestWishlistProducts(guestIds);
          lastWishlistRefreshAtRef.current = Date.now();
        } finally {
          wishlistRefreshInFlightRef.current = null;
        }
      })();

      return wishlistRefreshInFlightRef.current;
    },
    [fetchGuestWishlistProducts, fetchServerWishlist],
  );

  const refreshCart = useCallback(
    async (options: RefreshOptions = {}) => {
      const now = Date.now();
      if (!options.force && now - lastCartRefreshAtRef.current < REFRESH_THROTTLE_MS) {
        return cartRefreshInFlightRef.current ?? Promise.resolve();
      }
      if (cartRefreshInFlightRef.current) return cartRefreshInFlightRef.current;

      cartRefreshInFlightRef.current = (async () => {
        try {
          await fetchServerCart();
          lastCartRefreshAtRef.current = Date.now();
        } catch {
          setCart(readGuestCartItems());
          lastCartRefreshAtRef.current = Date.now();
        } finally {
          cartRefreshInFlightRef.current = null;
        }
      })();

      return cartRefreshInFlightRef.current;
    },
    [fetchServerCart],
  );

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

      await Promise.all([refreshWishlist({ force: true }), refreshCart({ force: true })]);
    };

    void syncUserState();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      setUserEmail(session?.user?.email ?? null);

      if (event === "SIGNED_IN" && session?.user) {
        void (async () => {
          await mergeGuestWishlistIntoServer();
          await mergeGuestCartIntoServer();
          await Promise.all([refreshWishlist({ force: true }), refreshCart({ force: true })]);
        })();
        return;
      }

      if (event === "SIGNED_OUT") {
        const guestIds = readGuestWishlistIds();
        setWishlistIds(guestIds);
        setCart(readGuestCartItems());
        void fetchGuestWishlistProducts(guestIds);
      }
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
      addToCart: async (product) => {
        const productId = String(product.id ?? "").trim();
        if (!productId) {
          return { ok: false, code: "invalid", message: "Invalid product." } as CartActionResult;
        }

        const stock = getSafeStock(product);
        if (stock <= 0) {
          return {
            ok: false,
            code: "out_of_stock",
            message: "This product is currently out of stock.",
            available: 0,
          } as CartActionResult;
        }

        if (userEmail) {
          const token = await getAccessToken();
          if (!token) {
            return { ok: false, code: "unauthorized", message: "Please login to continue." } as CartActionResult;
          }

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
          }).catch(() => null);

          if (!response) {
            await refreshCart({ force: true });
            return { ok: false, code: "error", message: "Could not add to cart." } as CartActionResult;
          }

          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            if (response.status === 409) {
              const available = Number(payload?.available ?? stock);
              return {
                ok: false,
                code: available <= 0 ? "out_of_stock" : "stock_limit",
                message:
                  available <= 0
                    ? "This product is currently out of stock."
                    : getStockLimitMessage(Math.max(0, available - Number(payload?.quantity ?? 0))),
                available,
              } as CartActionResult;
            }
            await refreshCart({ force: true });
            return { ok: false, code: "error", message: String(payload?.error ?? "Could not add to cart.") } as CartActionResult;
          }

          if (Array.isArray(payload?.items)) {
            const normalizedItems = normalizeCartItems(payload.items as CartApiItem[]);
            setCart(normalizedItems);
            const updated = normalizedItems.find((item) => item.product.id === productId);
            return {
              ok: true,
              code: "added",
              message: "Added to cart.",
              quantity: updated?.quantity ?? 1,
            } as CartActionResult;
          }

          await refreshCart({ force: true });
          return { ok: true, code: "added", message: "Added to cart." } as CartActionResult;
        }

        let result: CartActionResult = { ok: false, code: "error", message: "Could not add to cart." };
        setCart((current) => {
          const index = current.findIndex((item) => item.product.id === product.id);
          if (index > -1) {
            const existing = current[index];
            const available = getSafeStock(existing.product);
            if (existing.quantity >= available) {
              result = {
                ok: false,
                code: "stock_limit",
                message: getStockLimitMessage(Math.max(0, available - existing.quantity)),
                available,
                quantity: existing.quantity,
              };
              return current;
            }

            const nextQuantity = existing.quantity + 1;
            result = { ok: true, code: "added", message: "Added to cart.", quantity: nextQuantity };
            return current.map((item, itemIndex) =>
              itemIndex !== index
                ? item
                : {
                    ...item,
                    quantity: nextQuantity,
                  },
            );
          }
          result = { ok: true, code: "added", message: "Added to cart.", quantity: 1 };
          return [...current, { product, quantity: 1 }];
        });
        return result;
      },
      removeFromCart: async (productId) => {
        const previousItem = cart.find((item) => item.product.id === productId) ?? null;
        setCart((current) => current.filter((item) => item.product.id !== productId));

        if (userEmail) {
          const token = await getAccessToken();
          if (!token) {
            if (previousItem) {
              setCart((current) => [...current, previousItem]);
            }
            return { ok: false, code: "unauthorized", message: "Please login to continue." };
          }

          const existing = cart.find((item) => item.product.id === productId);
          if (!existing?.cartItemId) {
            return { ok: true, code: "removed", message: "Removed from cart." };
          }

          const response = await fetch(`/api/cart/${existing.cartItemId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            if (previousItem) {
              setCart((current) => {
                const alreadyExists = current.some((item) => item.product.id === previousItem.product.id);
                if (alreadyExists) return current;
                return [...current, previousItem];
              });
            }
            return { ok: false, code: "error", message: payload?.error ?? "Could not remove cart item." };
          }
        }
        return { ok: true, code: "removed", message: "Removed from cart." };
      },
      updateCartQuantity: async (productId, quantity) => {
        const existing = cart.find((item) => item.product.id === productId);
        if (!existing) return { ok: false, code: "invalid", message: "Cart item not found." };
        const previousQuantity = existing.quantity;

        if (quantity <= 0) {
          setCart((current) => current.filter((item) => item.product.id !== productId));

          if (userEmail) {
            const token = await getAccessToken();
            if (!token || !existing.cartItemId) {
              setCart((current) => [...current, existing]);
              return { ok: false, code: "unauthorized", message: "Please login to continue." };
            }
            const response = await fetch(`/api/cart/${existing.cartItemId}`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }).catch(() => null);
            if (!response?.ok) {
              setCart((current) => {
                const alreadyExists = current.some((item) => item.product.id === existing.product.id);
                if (alreadyExists) return current;
                return [...current, existing];
              });
              return { ok: false, code: "error", message: "Could not remove cart item." };
            }
          }

          return { ok: true, code: "removed", message: "Removed from cart.", quantity: 0 };
        }

        const safeStock = getSafeStock(existing.product);
        const cappedQuantity = Math.min(Math.max(1, quantity), Math.max(1, safeStock));
        const wasCapped = quantity > safeStock;

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
          const token = await getAccessToken();
          if (!token || !existing.cartItemId) {
            setCart((current) =>
              current.map((item) =>
                item.product.id === productId
                  ? {
                      ...item,
                      quantity: previousQuantity,
                    }
                  : item,
              ),
            );
            return { ok: false, code: "unauthorized", message: "Please login to continue." };
          }

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
            setCart((current) =>
              current.map((item) =>
                item.product.id === productId
                  ? {
                      ...item,
                      quantity: previousQuantity,
                    }
                  : item,
              ),
            );
            if (response.status === 409) {
              const available = Number(payload?.available ?? safeStock);
              return {
                ok: false,
                code: available <= 0 ? "out_of_stock" : "stock_limit",
                message: available <= 0 ? "This product is currently out of stock." : getStockLimitMessage(Math.max(0, available - cappedQuantity)),
                available,
                quantity: cappedQuantity,
              };
            }
            return { ok: false, code: "error", message: payload?.error ?? "Could not update cart quantity." };
          }
        }
        if (wasCapped) {
          return {
            ok: false,
            code: "stock_limit",
            message: getStockLimitMessage(Math.max(0, safeStock - cappedQuantity)),
            available: safeStock,
            quantity: cappedQuantity,
          };
        }
        return { ok: true, code: "updated", message: "Cart updated.", quantity: cappedQuantity };
      },
      addToWishlist: async (product) => {
        const productId = String(product.id);
        if (!productId) return { ok: false, code: "error", message: "Invalid product." } as WishlistActionResult;
        if (wishlistIds.includes(productId)) {
          return {
            ok: false,
            code: "already_wishlisted",
            message: "Already in wishlist.",
          } as WishlistActionResult;
        }

        const applyWishlistState = () => {
          setWishlistIds((current) => [...current, productId]);
          setWishlist((current) => [
            {
              productId,
              product,
            },
            ...current.filter((item) => item.productId !== productId),
          ]);
        };

        if (userEmail) {
          const token = await getAccessToken();
          if (!token) {
            return { ok: false, code: "unauthorized", message: "Please login to continue." } as WishlistActionResult;
          }
          const response = await fetch("/api/wishlist", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ product_id: productId }),
          }).catch(() => null);

          if (!response) {
            await refreshWishlist({ force: true });
            return { ok: false, code: "error", message: "Could not update wishlist." } as WishlistActionResult;
          }

          if (!response.ok) {
            await refreshWishlist({ force: true });
            const payload = await response.json().catch(() => ({}));
            return {
              ok: false,
              code: "error",
              message: String(payload?.error ?? "Could not update wishlist."),
            } as WishlistActionResult;
          }

          applyWishlistState();
          return { ok: true, code: "added", message: "Added to wishlist." } as WishlistActionResult;
        }

        applyWishlistState();
        const nextGuestIds = [...new Set([...readGuestWishlistIds(), productId])];
        writeGuestWishlistIds(nextGuestIds);
        return { ok: true, code: "added", message: "Added to wishlist." } as WishlistActionResult;
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
              await refreshWishlist({ force: true });
              return;
            }
          })();
          return;
        }

        const nextGuestIds = readGuestWishlistIds().filter((id) => id !== productId);
        writeGuestWishlistIds(nextGuestIds);
      },
      moveWishlistToCart: (productId) => {
        const entry = wishlist.find((item) => item.productId === productId);
        if (!entry?.product) {
          return;
        }
        if (getSafeStock(entry.product) <= 0) {
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
