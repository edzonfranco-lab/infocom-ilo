import { useState, useEffect, useSyncExternalStore } from 'react';
import { getCartItems, getCartCount, getCartTotal, subscribeToCart, CartItem } from '@/lib/cart';

export function useCart() {
  const items = useSyncExternalStore(
    subscribeToCart,
    getCartItems,
    getCartItems
  );
  const count = useSyncExternalStore(
    subscribeToCart,
    getCartCount,
    getCartCount
  );
  const total = useSyncExternalStore(
    subscribeToCart,
    getCartTotal,
    getCartTotal
  );

  return { items, count, total };
}
