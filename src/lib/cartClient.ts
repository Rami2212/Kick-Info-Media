export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  team: string;
  imageUrl: string;
  price: number;
  currency: string;
  size: string;
  quantity: number;
  stock: number;
};

const CART_STORAGE_KEY = "kickinfomedia_cart_v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.min(20, Math.floor(value));
}

function normalizePrice(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100) / 100;
}

function dispatchCartUpdated() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCartItems(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const productId = typeof item?.productId === "string" ? item.productId.trim() : "";
        const slug = typeof item?.slug === "string" ? item.slug.trim() : "";
        const name = typeof item?.name === "string" ? item.name.trim() : "";
        const imageUrl = typeof item?.imageUrl === "string" ? item.imageUrl.trim() : "";
        const currency = typeof item?.currency === "string" ? item.currency.trim().toUpperCase() : "USD";
        if (!productId || !slug || !name) return null;
        return {
          productId,
          slug,
          name,
          team: typeof item?.team === "string" ? item.team.trim() : "",
          imageUrl,
          price: normalizePrice(Number(item?.price)),
          currency: currency || "USD",
          size: typeof item?.size === "string" ? item.size.trim() : "",
          quantity: normalizeQuantity(Number(item?.quantity)),
          stock: Number.isFinite(Number(item?.stock)) ? Math.max(0, Math.floor(Number(item.stock))) : 0,
        } satisfies CartItem;
      })
      .filter((item): item is CartItem => !!item);
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  dispatchCartUpdated();
}

export function clearCartItems() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(CART_STORAGE_KEY);
  dispatchCartUpdated();
}

export function addToCart(item: CartItem) {
  const current = getCartItems();
  const key = `${item.productId}::${item.size || "-"}`;
  const existing = current.find((entry) => `${entry.productId}::${entry.size || "-"}` === key);
  if (existing) {
    existing.quantity = normalizeQuantity(existing.quantity + item.quantity);
  } else {
    current.push({
      ...item,
      quantity: normalizeQuantity(item.quantity),
      price: normalizePrice(item.price),
    });
  }
  saveCartItems(current);
}

export function removeCartItem(productId: string, size: string) {
  const current = getCartItems();
  const next = current.filter((entry) => !(entry.productId === productId && entry.size === size));
  saveCartItems(next);
}

export function updateCartQuantity(productId: string, size: string, quantity: number) {
  const current = getCartItems();
  const next = current.map((entry) => {
    if (entry.productId === productId && entry.size === size) {
      return { ...entry, quantity: normalizeQuantity(quantity) };
    }
    return entry;
  });
  saveCartItems(next);
}

export function getCartSummary(items: CartItem[]) {
  const currency = items[0]?.currency || "USD";
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    currency,
    subtotal: Math.round(subtotal * 100) / 100,
    totalQty,
  };
}

