import { useState, useEffect, useCallback } from 'react';
import { getCartItems, getCartCount, getCartTotal, subscribeToCart, CartItem } from '@/lib/cart';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(getCartItems);
  const [count, setCount] = useState<number>(getCartCount);
  const [total, setTotal] = useState<number>(getCartTotal);

  useEffect(() => {
    const unsubscribe = subscribeToCart(() => {
      setItems(getCartItems());
      setCount(getCartCount());
      setTotal(getCartTotal());
    });
    return () => { unsubscribe(); };
  }, []);

  return { items, count, total };
}
