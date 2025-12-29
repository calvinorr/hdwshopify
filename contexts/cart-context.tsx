"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface CartItem {
  id: string;
  productId: number;
  productName: string;
  productSlug: string;
  colorway?: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  weightGrams: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  error: string | null;
  addItem: (
    productId: number,
    quantity: number,
    productInfo?: { name: string; colorway?: string }
  ) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer for quantity updates
  const [quantityDebounce, setQuantityDebounce] = useState<{
    [key: string]: NodeJS.Timeout;
  }>({});

  // Fetch cart on mount
  const refreshCart = useCallback(async () => {
    try {
      const response = await fetch("/api/cart");
      if (!response.ok) {
        throw new Error("Failed to fetch cart");
      }
      const data = await response.json();
      setItems(data.items);
      setError(null);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Add item to cart with optimistic update
  const addItem = useCallback(
    async (
      productId: number,
      quantity: number,
      productInfo?: { name: string; colorway?: string }
    ): Promise<boolean> => {
      // Optimistic update
      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) => item.productId === productId
        );
        if (existingIndex >= 0) {
          const updated = [...prevItems];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
        }
        // For new items, we'll update on server response
        return prevItems;
      });

      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Revert optimistic update on error
          await refreshCart();

          toast.error("Could not add to cart", {
            description: data.error || "Please try again",
          });
          return false;
        }

        setItems(data.items);

        // Show success toast
        if (productInfo) {
          toast.success("Added to cart", {
            description: productInfo.colorway
              ? `${productInfo.name} - ${productInfo.colorway}`
              : productInfo.name,
            action: {
              label: "View Cart",
              onClick: () => router.push("/cart"),
            },
          });
        }

        return true;
      } catch (err) {
        // Revert optimistic update on error
        await refreshCart();

        toast.error("Could not add to cart", {
          description: "Please check your connection and try again",
        });
        return false;
      }
    },
    [refreshCart, router]
  );

  // Update item quantity with optimistic update and debounce
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      // Clear existing debounce timer for this item
      if (quantityDebounce[itemId]) {
        clearTimeout(quantityDebounce[itemId]);
      }

      // Optimistic update
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );

      // Debounce the API call
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`/api/cart/${itemId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity }),
          });

          const data = await response.json();

          if (!response.ok) {
            await refreshCart();
            toast.error("Could not update quantity", {
              description: data.error || "Please try again",
            });
            return;
          }

          setItems(data.items);
        } catch {
          await refreshCart();
          toast.error("Could not update quantity", {
            description: "Please check your connection",
          });
        }
      }, 500);

      setQuantityDebounce((prev) => ({ ...prev, [itemId]: timer }));
    },
    [quantityDebounce, refreshCart]
  );

  // Remove item with optimistic update
  const removeItem = useCallback(
    async (itemId: string) => {
      const removedItem = items.find((item) => item.id === itemId);

      // Optimistic update
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          await refreshCart();
          toast.error("Could not remove item", {
            description: data.error || "Please try again",
          });
          return;
        }

        setItems(data.items);

        if (removedItem) {
          toast.success("Removed from cart", {
            description: removedItem.colorway
              ? `${removedItem.productName} - ${removedItem.colorway}`
              : removedItem.productName,
          });
        }
      } catch {
        await refreshCart();
        toast.error("Could not remove item", {
          description: "Please check your connection",
        });
      }
    },
    [items, refreshCart]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    const previousItems = [...items];

    // Optimistic update
    setItems([]);

    try {
      // Remove all items one by one
      for (const item of previousItems) {
        await fetch(`/api/cart/${item.id}`, { method: "DELETE" });
      }
    } catch {
      // Revert on error
      setItems(previousItems);
      toast.error("Could not clear cart", {
        description: "Please try again",
      });
    }
  }, [items]);

  // Calculate derived values
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      isLoading,
      error,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      isLoading,
      error,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
