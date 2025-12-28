"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "herbarium-recently-viewed";
const MAX_ITEMS = 10;
const EXPIRY_DAYS = 30;

export interface ViewedProduct {
  slug: string;
  name: string;
  image: string | null;
  price: number;
  category?: string;
  timestamp: number;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<ViewedProduct[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ViewedProduct[] = JSON.parse(stored);
        // Filter out expired items
        const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const fresh = parsed.filter(
          (item) => Date.now() - item.timestamp < expiryTime
        );
        setItems(fresh);
        // Clean up expired items in storage
        if (fresh.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        }
      }
    } catch (error) {
      console.warn("Failed to load recently viewed:", error);
    }
    setIsLoaded(true);
  }, []);

  const addProduct = useCallback(
    (product: Omit<ViewedProduct, "timestamp">) => {
      setItems((prev) => {
        // Remove if already exists (will re-add at front)
        const filtered = prev.filter((p) => p.slug !== product.slug);
        // Add to front with timestamp
        const updated: ViewedProduct[] = [
          { ...product, timestamp: Date.now() },
          ...filtered,
        ];
        // Trim to max items
        const trimmed = updated.slice(0, MAX_ITEMS);
        // Persist to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        } catch (error) {
          console.warn("Failed to save recently viewed:", error);
        }
        return trimmed;
      });
    },
    []
  );

  const clearHistory = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear recently viewed:", error);
    }
  }, []);

  return {
    items,
    isLoaded,
    addProduct,
    clearHistory,
  };
}
