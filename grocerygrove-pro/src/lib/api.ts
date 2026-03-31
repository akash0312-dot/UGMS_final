import type { Product, Worker, Agency, Invoice } from "@/data/mockData";
import { useStore } from "@/store/useStore";

/** In dev, empty string = same-origin `/api` (see Vite proxy). Set VITE_API_BASE_URL if the API is elsewhere. */
function resolveApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.DEV) return "";
  return "http://127.0.0.1:5000";
}

export const API_BASE = resolveApiBase();

export function formatApiNetworkError(err: unknown): string {
  if (err instanceof TypeError && (err.message === "Failed to fetch" || err.message.includes("fetch"))) {
    const hint =
      API_BASE === ""
        ? "Cannot reach the API via this app’s dev server. Start Flask on port 5000 (see Vite proxy in vite.config.ts)."
        : `Cannot reach the API at ${API_BASE}. Start the backend or fix VITE_API_BASE_URL.`;
    return hint;
  }
  return err instanceof Error ? err.message : "Request failed";
}

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
  category_id?: number | null;
  category_name?: string | null;
  experience_years: number;
  phone?: string;
  salary: number;
  days_present?: number;
  days_absent?: number;
  is_active: boolean;
  has_password?: boolean;
}

export interface ApiWorkerCategory {
  id: number;
  name: string;
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

export async function createOrderInApi(items: CreateOrderItemInput[], customerName?: string) {
  const payload = {
    customer_name: customerName || "Walk-in Customer",
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
    db_id: w.id as any,
    worker_code: w.worker_code,
    name: w.name,
    position: w.category_name || w.role || "Staff",
    categoryId: w.category_id ?? null,
    categoryName: w.category_name ?? null,
    experience: w.experience_years ?? 0,
    salary: Number(w.salary),
    phone: w.phone ?? "",
    email: "",
    daysPresent: w.days_present ?? 0,
    daysAbsent: w.days_absent ?? 0,
    hasPassword: w.has_password,
  }));
}

export async function fetchWorkerCategoriesFromApi(): Promise<ApiWorkerCategory[]> {
  const res = await fetch(`${API_BASE}/api/worker-categories`);
  if (!res.ok) {
    throw new Error(`Failed to load worker categories (${res.status})`);
  }
  return (await res.json()) as ApiWorkerCategory[];
}

export async function createWorkerCategoryInApi(name: string): Promise<ApiWorkerCategory> {
  const res = await fetch(`${API_BASE}/api/worker-categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create category (${res.status})`);
  }
  return res.json();
}

export async function createWorkerInApi(input: {
  workerCode: string;
  password: string;
  categoryId: number;
  name: string;
  position: string;
  experience: number;
  salary: number;
  phone?: string;
  daysPresent?: number;
  daysAbsent?: number;
}) {
  const payload = {
    worker_code: input.workerCode.trim(),
    password: input.password,
    category_id: input.categoryId,
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
  categoryId: number;
  experience: number;
  salary: number;
  phone?: string;
  daysPresent?: number;
  daysAbsent?: number;
  password?: string;
}) {
  const payload: Record<string, unknown> = {
    name: input.name,
    role: input.position,
    category_id: input.categoryId,
    experience_years: input.experience,
    salary: input.salary,
    phone: input.phone,
    days_present: input.daysPresent ?? 0,
    days_absent: input.daysAbsent ?? 0,
  };
  if (input.password && input.password.length > 0) {
    payload.password = input.password;
  }

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

export async function workerLoginInApi(workerCode: string, password: string): Promise<{ access_token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/worker/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ worker_code: workerCode.trim(), password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Worker login failed (${res.status})`);
  }
  return res.json();
}

export async function markAttendanceInApi(workerCode: string, status: "Present" | "Absent" | "Leave", dateStr?: string) {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/hr/attendance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ worker_code: workerCode, status, date: dateStr }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to mark attendance (${res.status})`);
  }
  return res.json();
}

export async function updateWorkerSalaryInApi(workerCode: string, newSalary?: number, bonus?: number) {
  const token = useStore.getState().authToken;
  const payload: any = {};
  if (newSalary !== undefined) payload.salary = newSalary;
  if (bonus !== undefined) payload.bonus = bonus;

  const res = await fetch(`${API_BASE}/api/hr/workers/${workerCode}/salary`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update salary/bonus (${res.status})`);
  }
  return res.json();
}

export async function fetchMyProfileInApi() {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/worker/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchMyLeavesInApi() {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/worker/leaves`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function submitLeaveRequestInApi(dateStr: string, reason: string) {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/worker/leaves`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ date: dateStr, reason }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchMyMessagesInApi() {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/worker/messages`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sendWorkerMessageInApi(receiverRole: "hr" | "admin", content: string) {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/worker/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ receiver_role: receiverRole, content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAllLeavesInApi() {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/hr/leaves`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function resolveLeaveInApi(id: number, status: "Approved" | "Rejected") {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/hr/leaves/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchAdminMessagesInApi() {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/admin/messages`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function broadcastAdminMessageInApi(content: string, workerId?: number | string, receiverRole: string = "worker") {
  const token = useStore.getState().authToken;
  const payload: any = { receiver_role: receiverRole, content };
  if (workerId && workerId !== "admin") payload.receiver_worker_id = workerId;
  const res = await fetch(`${API_BASE}/api/admin/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function markMessageReadInApi(id: number) {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/admin/messages/${id}/read`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
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

export async function customerLoginInApi(email: string, password: string): Promise<{ access_token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/customer/login`, {
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

export async function customerSignupInApi(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ access_token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/customer/signup`, {
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

export async function requestSalaryChangeInApi(workerCode: string, salary?: number, bonus?: number) {
  const token = useStore.getState().authToken;
  const payload: any = {};
  if (salary !== undefined) payload.salary = salary;
  if (bonus !== undefined) payload.bonus = bonus;

  const res = await fetch(`${API_BASE}/api/hr/workers/${workerCode}/salary-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to request salary/bonus change (${res.status})`);
  }
  return res.json();
}

export async function fetchSalaryRequestsInApi() {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/admin/salary-requests`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function resolveSalaryRequestInApi(id: number, status: "Approved" | "Rejected") {
  const token = useStore.getState().authToken;
  const res = await fetch(`${API_BASE}/api/admin/salary-requests/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
