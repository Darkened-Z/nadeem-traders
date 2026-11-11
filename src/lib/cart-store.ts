import { useState, useEffect } from "react";
import { getCartItems, addToCartDb, updateCartItemQuantityDb, removeFromCartDb } from "./actions";
import { toast } from "sonner";

export interface CartItem {
  id: number; // represents the product.id
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

// Maps to track server state and queue status per product ID
const confirmedQuantities = new Map<number, number>();
const latestRequestedQty = new Map<number, number>();
const debounceTimers = new Map<number, NodeJS.Timeout>();
const requestSequence = new Map<number, number>();
const activeRequests = new Map<number, boolean>();

// Load initial cart once when script loads (in background)
let isInitialized = false;

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
      const items = await getCartItems({ data: {} });
      if (items && items.length > 0) {
        cartState = items.map((item) => ({
          id: item.id, // product ID
          name: item.name,
          brand: item.brand,
          weight: item.weight,
          price: item.price,
          wholesale_price: item.wholesale_price,
          wholesale_min_qty: item.wholesale_min_qty || 1,
          emoji: item.emoji || "🌾",
          quantity: item.quantity,
          image_url: item.image_url,
        }));
      } else if (typeof window !== "undefined") {
        const stored = localStorage.getItem("nadeem_cart");
        if (stored) {
          try {
            cartState = JSON.parse(stored);
          } catch {}
        }
      }

      // Set confirmed states
      confirmedQuantities.clear();
      latestRequestedQty.clear();
      for (const item of cartState) {
        confirmedQuantities.set(item.id, item.quantity);
        latestRequestedQty.set(item.id, item.quantity);
      }
      notify();
    } catch (e) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("nadeem_cart");
        if (stored) {
          try {
            cartState = JSON.parse(stored);
            notify();
          } catch {}
        }
      }
    }
  },

  subscribe(listener: (cart: CartItem[]) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  addToCart(product: any, qty: number = 1, isWholesale: boolean = false) {
    const existingIndex = cartState.findIndex((item) => item.id === product.id);
    const prevConfirmed = confirmedQuantities.get(product.id) || 0;
    
    let targetQty = qty;
    if (existingIndex > -1) {
      targetQty = cartState[existingIndex].quantity + qty;
      cartState[existingIndex] = {
        ...cartState[existingIndex],
        quantity: targetQty,
      };
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        brand: product.brand,
        weight: product.weight,
        price: product.price,
        wholesale_price: product.wholesale_price || null,
        wholesale_min_qty: product.wholesale_min_qty || 1,
        emoji: product.emoji || "🌾",
        quantity: qty,
        image_url: product.image_url || null,
      };
      cartState.push(newItem);
    }

    latestRequestedQty.set(product.id, targetQty);
    notify();

    // Trigger debounced synchronization
    this.scheduleSync(product.id, product.name);
  },

  updateQuantity(productId: number, delta: number) {
    const existingIndex = cartState.findIndex((item) => item.id === productId);
    if (existingIndex === -1) return;

    const currentQty = cartState[existingIndex].quantity;
    const newQty = currentQty + delta;
    latestRequestedQty.set(productId, newQty);

    const productName = cartState[existingIndex].name;

    if (newQty <= 0) {
      cartState = cartState.filter((item) => item.id !== productId);
    } else {
      cartState[existingIndex] = {
        ...cartState[existingIndex],
        quantity: newQty,
      };
    }

    notify();

    // Trigger debounced synchronization
    this.scheduleSync(productId, productName);
  },

  removeFromCart(productId: number) {
    const existingItem = cartState.find((item) => item.id === productId);
    if (!existingItem) return;

    latestRequestedQty.set(productId, 0);
    cartState = cartState.filter((item) => item.id !== productId);
    notify();

    this.scheduleSync(productId, existingItem.name);
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

  scheduleSync(productId: number, productName: string) {
    // Clear existing timer to debounce rapid quantity changes (250ms)
    if (debounceTimers.has(productId)) {
      clearTimeout(debounceTimers.get(productId)!);
    }

    const timer = setTimeout(async () => {
      debounceTimers.delete(productId);
      
      const targetQty = latestRequestedQty.get(productId) ?? 0;
      const confirmedQty = confirmedQuantities.get(productId) ?? 0;

      // Skip API request if current client state matches the server's confirmed state
      if (targetQty === confirmedQty) return;

      // Increment sequence number to prevent race conditions
      const seq = (requestSequence.get(productId) || 0) + 1;
      requestSequence.set(productId, seq);

      try {
        activeRequests.set(productId, true);

        if (targetQty <= 0) {
          await removeFromCartDb({ data: { productId } });
        } else if (confirmedQty === 0) {
          // If not previously in database, add it
          await addToCartDb({ data: { productId, quantity: targetQty } });
        } else {
          // If already in database, update quantity
          await updateCartItemQuantityDb({ data: { productId, quantity: targetQty } });
        }

        // Only update verified state if this was the latest request dispatched
        if (requestSequence.get(productId) === seq) {
          confirmedQuantities.set(productId, targetQty);
          activeRequests.delete(productId);
        }
      } catch (err: any) {
        if (requestSequence.get(productId) === seq) {
          console.warn(`Local cart retained; backend sync info:`, err?.message);
          activeRequests.delete(productId);
          // Keep optimistic local cart intact
          confirmedQuantities.set(productId, targetQty);
        }
      }
    }, 250);

    debounceTimers.set(productId, timer);
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
