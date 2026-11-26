import { useState, useEffect } from "react";
import { getCartItems, addToCartDb, updateCartItemQuantityDb, removeFromCartDb } from "./actions";
import { track } from "./analytics";
import { toast } from "sonner";
import { cleanProductTitle } from "./catalog";

export interface CartItem {
  key: string; // product id + chosen option, one cart line each
  id: number; // product id
  variant: string; // chosen option, "" when the product has none
  name: string;
  brand: string;
  weight: string;
  price: number;
  wholesale_price: number | null;
  wholesale_min_qty: number;
  emoji: string;
  quantity: number;
  image_url: string | null;
}

let cartState: CartItem[] = [];
const listeners = new Set<(cart: CartItem[]) => void>();

const cartDrawerListeners = new Set<(open: boolean) => void>();
export const openCartDrawer = () => {
  cartDrawerListeners.forEach((l) => l(true));
};
export const subscribeCartDrawer = (listener: (open: boolean) => void) => {
  cartDrawerListeners.add(listener);
  return () => {
    cartDrawerListeners.delete(listener);
  };
};

const checkoutModalListeners = new Set<(open: boolean) => void>();
export const openCheckoutModal = () => {
  checkoutModalListeners.forEach((l) => l(true));
};
export const subscribeCheckoutModal = (listener: (open: boolean) => void) => {
  checkoutModalListeners.add(listener);
  return () => {
    checkoutModalListeners.delete(listener);
  };
};

function notify() {
  const current = [...cartState];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("nadeem_cart", JSON.stringify(current));
    } catch {}
  }
  listeners.forEach((l) => l(current));
}

// Maps to track server state and queue status per cart line key
const confirmedQuantities = new Map<string, number>();
const latestRequestedQty = new Map<string, number>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const requestSequence = new Map<string, number>();

let isInitialized = false;

export const lineKey = (productId: number, variant = "") => `${productId}|${variant}`;

function withLineKey(item: any): CartItem {
  const variant = item.variant ?? "";
  return { ...item, variant, key: lineKey(item.id, variant) };
}

function readLocalCart(): CartItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("nadeem_cart");
    return stored ? (JSON.parse(stored) as any[]).map(withLineKey) : null;
  } catch {
    return null;
  }
}

export const cartStore = {
  getCart() {
    return cartState;
  },

  async initialize(force = false) {
    if (isInitialized && !force) return;
    isInitialized = true;
    await this.load();
  },

  async load() {
    try {
      const items: any[] = await getCartItems();
      if (items && items.length > 0) {
        cartState = items.map((item) => {
          const baseName = cleanProductTitle(item.name) || item.name;
          const variant = item.variant ?? "";
          return {
            key: lineKey(item.id, variant),
            id: item.id,
            variant,
            name: variant ? `${baseName} (${variant})` : baseName,
            brand: item.brand,
            weight: item.weight,
            price: item.price,
            wholesale_price: item.wholesale_price,
            wholesale_min_qty: item.wholesale_min_qty || 1,
            emoji: item.emoji || "🌾",
            quantity: item.quantity,
            image_url: item.image_url,
          };
        });
      } else {
        cartState = readLocalCart() ?? cartState;
      }
    } catch {
      cartState = readLocalCart() ?? cartState;
    }

    confirmedQuantities.clear();
    latestRequestedQty.clear();
    for (const item of cartState) {
      confirmedQuantities.set(item.key, item.quantity);
      latestRequestedQty.set(item.key, item.quantity);
    }
    notify();
  },

  subscribe(listener: (cart: CartItem[]) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  addToCart(product: any, qty: number = 1) {
    const variant: string = product.variant ?? "";
    const key = lineKey(product.id, variant);
    track("added_to_cart", { product_id: product.id, product_name: product.name, variant, quantity: qty, price: product.price });
    const existingIndex = cartState.findIndex((item) => item.key === key);

    let targetQty = qty;
    if (existingIndex > -1) {
      targetQty = cartState[existingIndex].quantity + qty;
      cartState[existingIndex] = { ...cartState[existingIndex], quantity: targetQty };
    } else {
      cartState.push({
        key,
        id: product.id,
        variant,
        name: product.name,
        brand: product.brand,
        weight: product.weight,
        price: product.price,
        wholesale_price: product.wholesale_price || null,
        wholesale_min_qty: product.wholesale_min_qty || 1,
        emoji: product.emoji || "🌾",
        quantity: qty,
        image_url: product.image_url || null,
      });
    }

    latestRequestedQty.set(key, targetQty);
    notify();
    this.scheduleSync(key);
  },

  updateQuantity(key: string, delta: number) {
    const existingIndex = cartState.findIndex((item) => item.key === key);
    if (existingIndex === -1) return;

    const newQty = cartState[existingIndex].quantity + delta;
    latestRequestedQty.set(key, newQty);

    if (newQty <= 0) {
      cartState = cartState.filter((item) => item.key !== key);
    } else {
      cartState[existingIndex] = { ...cartState[existingIndex], quantity: newQty };
    }

    notify();
    this.scheduleSync(key);
  },

  removeFromCart(key: string) {
    if (!cartState.some((item) => item.key === key)) return;
    latestRequestedQty.set(key, 0);
    cartState = cartState.filter((item) => item.key !== key);
    notify();
    this.scheduleSync(key);
  },

  clearCartLocal() {
    cartState = [];
    confirmedQuantities.clear();
    latestRequestedQty.clear();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("nadeem_cart");
      } catch {}
    }
    notify();
  },

  // Debounced (250ms) server sync per cart line; a sequence number drops stale responses.
  scheduleSync(key: string) {
    if (debounceTimers.has(key)) clearTimeout(debounceTimers.get(key)!);

    const timer = setTimeout(async () => {
      debounceTimers.delete(key);
      const targetQty = latestRequestedQty.get(key) ?? 0;
      const confirmedQty = confirmedQuantities.get(key) ?? 0;
      if (targetQty === confirmedQty) return;

      const seq = (requestSequence.get(key) || 0) + 1;
      requestSequence.set(key, seq);

      const [id, variant] = key.split("|");
      const productId = Number(id);
      try {
        if (targetQty <= 0) {
          await removeFromCartDb({ data: { productId, variant } });
        } else if (confirmedQty === 0) {
          await addToCartDb({ data: { productId, variant, quantity: targetQty } });
        } else {
          await updateCartItemQuantityDb({ data: { productId, variant, quantity: targetQty } });
        }
      } catch (err: any) {
        console.warn(`Local cart retained; backend sync info:`, err?.message);
      }
      // The local cart stays authoritative even when the backend sync fails.
      if (requestSequence.get(key) === seq) confirmedQuantities.set(key, targetQty);
    }, 250);

    debounceTimers.set(key, timer);
  },
};

// React hook to access cart state reactively
export function useCart() {
  const [cart, setCart] = useState<CartItem[]>(cartStore.getCart());

  useEffect(() => {
    // Initial fetch if needed
    cartStore.initialize();

    // Register subscription
    const unsubscribe = cartStore.subscribe((newCart) => {
      setCart(newCart);
    });

    return unsubscribe;
  }, []);

  return cart;
}
