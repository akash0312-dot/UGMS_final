import { create } from 'zustand';
import { Product, CartItem, Invoice, Worker, Agency } from '@/data/mockData';

const loadInitialInvoices = (): Invoice[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('ugms-invoices');
    return raw ? (JSON.parse(raw) as Invoice[]) : [];
  } catch {
    return [];
  }
};

export interface Owner {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface AppState {
  // Auth
  role: 'none' | 'customer' | 'admin';
  setRole: (role: 'none' | 'customer' | 'admin') => void;
  authToken: string | null;
  setAuthToken: (token: string | null) => void;

  // Products
  products: Product[];
  setProducts: (products: Product[]) => void;
  updateProductStock: (productId: string, quantitySold: number) => void;
  addProduct: (product: Product) => void;
  restockProduct: (productId: string, quantity: number) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;

  // Workers
  workers: Worker[];
  setWorkers: (workers: Worker[]) => void;
  addWorker: (worker: Worker) => void;
  updateWorker: (id: string, worker: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;

  // Agencies
  agencies: Agency[];
  setAgencies: (agencies: Agency[]) => void;
  addAgency: (agency: Agency) => void;
  updateAgency: (id: string, agency: Partial<Agency>) => void;
  deleteAgency: (id: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  role: 'none',
  setRole: (role) => set({ role }),
  authToken: null,
  setAuthToken: (authToken) => set({ authToken }),

  products: [],
  setProducts: (products) => set({ products }),
  updateProductStock: (productId, quantitySold) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock - quantitySold) } : p
      ),
    })),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  restockProduct: (productId, quantity) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, stock: p.stock + quantity } : p
      ),
    })),

  cart: [],
  addToCart: (product) =>
    set((state) => {
      const existing = state.cart.find((c) => c.product.id === product.id);
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
          ),
        };
      }
      return { cart: [...state.cart, { product, quantity: 1 }] };
    }),
  removeFromCart: (productId) =>
    set((state) => ({ cart: state.cart.filter((c) => c.product.id !== productId) })),
  updateCartQuantity: (productId, quantity) =>
    set((state) => ({
      cart: state.cart.map((c) =>
        c.product.id === productId ? { ...c, quantity: Math.max(1, quantity) } : c
      ),
    })),
  clearCart: () => set({ cart: [] }),

  invoices: loadInitialInvoices(),
  addInvoice: (invoice) =>
    set((state) => {
      const updated = [invoice, ...state.invoices];
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('ugms-invoices', JSON.stringify(updated));
        } catch {
          // ignore persistence errors
        }
      }
      return { invoices: updated };
    }),

  workers: [],
  setWorkers: (workers) => set({ workers }),
  addWorker: (worker) =>
    set((state) => {
      const updated = [...state.workers, worker];
      return { workers: updated };
    }),
  updateWorker: (id, data) =>
    set((state) => {
      const updated = state.workers.map((w) => (w.id === id ? { ...w, ...data } : w));
      return { workers: updated };
    }),
  deleteWorker: (id) =>
    set((state) => {
      const updated = state.workers.filter((w) => w.id !== id);
      return { workers: updated };
    }),

  agencies: [],
  setAgencies: (agencies) => set({ agencies }),
  addAgency: (agency) =>
    set((state) => {
      const updated = [...state.agencies, agency];
      return { agencies: updated };
    }),
  updateAgency: (id, data) =>
    set((state) => {
      const updated = state.agencies.map((a) => (a.id === id ? { ...a, ...data } : a));
      return { agencies: updated };
    }),
  deleteAgency: (id) =>
    set((state) => {
      const updated = state.agencies.filter((a) => a.id !== id);
      return { agencies: updated };
    }),
}));
