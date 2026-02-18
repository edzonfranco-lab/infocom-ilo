import { Product } from '@/lib/constants';

export interface CartItem {
  product: Product;
  quantity: number;
}

let cartItems: CartItem[] = [];
const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach(l => l());
}

export function getCartItems(): CartItem[] {
  return cartItems;
}

export function addToCart(product: Product) {
  const existing = cartItems.find(i => i.product.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({ product, quantity: 1 });
  }
  cartItems = [...cartItems];
  notify();
}

export function removeFromCart(productId: string) {
  cartItems = cartItems.filter(i => i.product.id !== productId);
  notify();
}

export function updateCartQuantity(productId: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  const item = cartItems.find(i => i.product.id === productId);
  if (item) {
    item.quantity = quantity;
    cartItems = [...cartItems];
    notify();
  }
}

export function clearCart() {
  cartItems = [];
  notify();
}

export function getCartTotal(): number {
  return cartItems.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
}

export function getCartCount(): number {
  return cartItems.reduce((sum, i) => sum + i.quantity, 0);
}

export function subscribeToCart(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
