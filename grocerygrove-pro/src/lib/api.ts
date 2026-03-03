import type { Product, Worker, Agency, Invoice } from "@/data/mockData";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

interface ApiProduct {
  id: number;
  name: string;
  sku: string;
  category?: string;
  image_url?: string;
  sale_price: number;
  cost_price: number | null;
  stock_qty: number;
  min_threshold: number;
  supplier_id?: number | null;
  is_low_stock: boolean;
}

interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

interface ApiWorker {
  id: number;
  worker_code: string;
  name: string;
  role?: string;
  experience_years: number;
  phone?: string;
  salary: number;
  days_present?: number;
  days_absent?: number;
  is_active: boolean;
}

interface ApiSupplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface ApiOrderItem {
  product_id: number;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface ApiOrder {
  id: number;
  customer_name?: string | null;
  created_at: string | null;
  payment_method?: string | null;
  total_amount: number;
  items: ApiOrderItem[];
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
    category: p.category || "General",
    price: p.sale_price,
    costPrice: p.cost_price ?? 0,
    stock: p.stock_qty,
    minStock: p.min_threshold,
    image: p.image_url || "📦",
    agencyIds: p.supplier_id != null ? [String(p.supplier_id)] : [],
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
  cost_price?: number;
  stock_qty: number;
  min_threshold?: number;
  image_url?: string;
  supplier_id?: number | string;
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

export async function updateProductInApi(productId: string, input: {
  name?: string;
  category?: string;
  sale_price?: number;
  cost_price?: number;
  stock_qty?: number;
  min_threshold?: number;
  image_url?: string;
  supplier_id?: number | string | null;
}) {
  const res = await fetch(`${API_BASE}/api/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update product (${res.status})`);
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

export async function fetchWorkersFromApi(): Promise<Worker[]> {
  const res = await fetch(`${API_BASE}/api/workers`);
  if (!res.ok) {
    throw new Error(`Failed to load workers (${res.status})`);
  }
  const data = (await res.json()) as ApiWorker[];

  return data.map((w) => ({
    id: w.worker_code,
    name: w.name,
    position: w.role || "Staff",
    experience: w.experience_years ?? 0,
    salary: Number(w.salary),
    phone: w.phone ?? "",
    email: "",
    daysPresent: w.days_present ?? 0,
    daysAbsent: w.days_absent ?? 0,
  }));
}

export async function createWorkerInApi(input: {
  name: string;
  position: string;
  experience: number;
  salary: number;
  phone?: string;
  daysPresent?: number;
  daysAbsent?: number;
}) {
  const payload = {
    name: input.name,
    role: input.position,
    experience_years: input.experience,
    salary: input.salary,
    phone: input.phone,
    days_present: input.daysPresent ?? 0,
    days_absent: input.daysAbsent ?? 0,
  };

  const res = await fetch(`${API_BASE}/api/workers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create worker (${res.status})`);
  }

  return res.json();
}

export async function updateWorkerInApi(workerId: string, input: {
  name: string;
  position: string;
  experience: number;
  salary: number;
  phone?: string;
  daysPresent?: number;
  daysAbsent?: number;
}) {
  const payload = {
    name: input.name,
    role: input.position,
    experience_years: input.experience,
    salary: input.salary,
    phone: input.phone,
    days_present: input.daysPresent ?? 0,
    days_absent: input.daysAbsent ?? 0,
  };

  const res = await fetch(`${API_BASE}/api/workers/${workerId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update worker (${res.status})`);
  }

  return res.json();
}

export async function deleteWorkerInApi(workerId: string) {
  const res = await fetch(`${API_BASE}/api/workers/${workerId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete worker (${res.status})`);
  }

  return res.json();
}

export async function fetchSuppliersFromApi(): Promise<Agency[]> {
  const res = await fetch(`${API_BASE}/api/suppliers`);
  if (!res.ok) {
    throw new Error(`Failed to load suppliers (${res.status})`);
  }
  const data = (await res.json()) as ApiSupplier[];

  return data.map((s) => ({
    id: String(s.id),
    name: s.name,
    contactPerson: s.contact_person ?? "",
    phone: s.phone ?? "",
    email: s.email ?? "",
    address: s.address ?? "",
    productsSupplied: [],
  }));
}

export async function createSupplierInApi(input: {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<Agency> {
  const payload = {
    name: input.name,
    contact_person: input.contactPerson,
    phone: input.phone,
    email: input.email,
    address: input.address,
  };

  const res = await fetch(`${API_BASE}/api/suppliers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create supplier (${res.status})`);
  }

  const data = (await res.json()) as ApiSupplier;
  return {
    id: String(data.id),
    name: data.name,
    contactPerson: data.contact_person ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    address: data.address ?? "",
    productsSupplied: [],
  };
}

export async function updateSupplierInApi(
  supplierId: string,
  input: {
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
  },
): Promise<Agency> {
  const payload = {
    name: input.name,
    contact_person: input.contactPerson,
    phone: input.phone,
    email: input.email,
    address: input.address,
  };

  const res = await fetch(`${API_BASE}/api/suppliers/${supplierId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update supplier (${res.status})`);
  }

  const data = (await res.json()) as ApiSupplier;
  return {
    id: String(data.id),
    name: data.name,
    contactPerson: data.contact_person ?? "",
    phone: data.phone ?? "",
    email: data.email ?? "",
    address: data.address ?? "",
    productsSupplied: [],
  };
}

export async function deleteSupplierInApi(supplierId: string) {
  const res = await fetch(`${API_BASE}/api/suppliers/${supplierId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete supplier (${res.status})`);
  }

  return res.json();
}

export async function fetchOrdersFromApi(): Promise<ApiOrder[]> {
  const res = await fetch(`${API_BASE}/api/orders`);
  if (!res.ok) {
    throw new Error(`Failed to load orders (${res.status})`);
  }
  return (await res.json()) as ApiOrder[];
}

export async function fetchDailySalesFromApi(date?: string) {
  const url = date ? `${API_BASE}/api/reports/daily-sales?date=${encodeURIComponent(date)}` : `${API_BASE}/api/reports/daily-sales`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to load daily sales (${res.status})`);
  }
  return res.json();
}

export async function fetchMonthlySummaryFromApi(year?: number, month?: number) {
  const search: string[] = [];
  if (year != null) search.push(`year=${year}`);
  if (month != null) search.push(`month=${month}`);
  const qs = search.length ? `?${search.join("&")}` : "";
  const res = await fetch(`${API_BASE}/api/reports/monthly-summary${qs}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to load monthly summary (${res.status})`);
  }
  return res.json();
}

export async function loginInApi(email: string, password: string): Promise<{ access_token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Login failed (${res.status})`);
  }

  return res.json();
}

export async function signupInApi(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ access_token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Signup failed (${res.status})`);
  }

  return res.json();
}
