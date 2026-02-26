import type { Product } from "@/data/mockData";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

interface ApiProduct {
  id: number;
  name: string;
  sku: string;
  sale_price: number;
  cost_price: number | null;
  stock_qty: number;
  min_threshold: number;
  is_low_stock: boolean;
}

interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export async function fetchProductsFromApi(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) {
    throw new Error(`Failed to load products (${res.status})`);
  }
  const data = (await res.json()) as ApiProduct[];

  // Map backend shape -> frontend Product shape
  return data.map((p) => ({
    id: String(p.id),
    name: p.name,
    category: "General", // category can be extended later via backend
    price: p.sale_price,
    costPrice: p.cost_price ?? 0,
    stock: p.stock_qty,
    minStock: p.min_threshold,
    image: "📦",
    agencyIds: [],
  }));
}

export async function createOrderInApi(items: CreateOrderItemInput[]) {
  const payload = {
    customer_name: "Walk-in Customer",
    payment_method: "cash",
    items: items.map((i) => ({
      product_id: Number(i.productId),
      quantity: i.quantity,
    })),
  };

  const res = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to place order (${res.status})`);
  }

  return res.json();
}

export async function createProductInApi(input: {
  name: string;
  category?: string;
  sale_price: number;
  stock_qty: number;
  min_threshold?: number;
  image_url?: string;
}) {
  const res = await fetch(`${API_BASE}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create product (${res.status})`);
  }

  return res.json();
}

export async function restockProductInApi(productId: string, quantity: number, cost_price?: number) {
  const res = await fetch(`${API_BASE}/api/products/${productId}/restock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cost_price != null ? { quantity, cost_price } : { quantity }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to restock product (${res.status})`);
  }

  return res.json();
}


