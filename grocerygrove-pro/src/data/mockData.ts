export interface Worker {
  id: string;
  name: string;
  position: string;
  experience: number;
  salary: number;
  phone: string;
  email: string;
  daysPresent: number;
  daysAbsent: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  image: string;
  agencyIds: string[];
}

export interface Agency {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  productsSupplied: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Invoice {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  gst: number;
  total: number;
   /** Profit for this bill (total revenue - total purchase cost) */
  profit?: number;
}

export interface DailySale {
  date: string;
  totalAmount: number;
  billCount: number;
  topProducts: string[];
}

export const workers: Worker[] = [
  { id: "W001", name: "Rahul Sharma", position: "Cashier", experience: 3, salary: 18000, phone: "9876543210", email: "rahul@ugms.com", daysPresent: 24, daysAbsent: 2 },
  { id: "W002", name: "Priya Patel", position: "Storekeeper", experience: 5, salary: 22000, phone: "9876543211", email: "priya@ugms.com", daysPresent: 22, daysAbsent: 4 },
  { id: "W003", name: "Amit Kumar", position: "Delivery", experience: 2, salary: 15000, phone: "9876543212", email: "amit@ugms.com", daysPresent: 25, daysAbsent: 1 },
  { id: "W004", name: "Sneha Reddy", position: "Cashier", experience: 1, salary: 16000, phone: "9876543213", email: "sneha@ugms.com", daysPresent: 20, daysAbsent: 6 },
  { id: "W005", name: "Vikram Singh", position: "Manager", experience: 8, salary: 35000, phone: "9876543214", email: "vikram@ugms.com", daysPresent: 26, daysAbsent: 0 },
];

export const products: Product[] = [
  { id: "P001", name: "Basmati Rice", category: "Grains", price: 120, costPrice: 90, stock: 50, minStock: 10, image: "🍚", agencyIds: ["A001"] },
  { id: "P002", name: "Whole Wheat Flour", category: "Grains", price: 45, costPrice: 35, stock: 80, minStock: 15, image: "🌾", agencyIds: ["A001", "A002"] },
  { id: "P003", name: "Toor Dal", category: "Pulses", price: 95, costPrice: 70, stock: 40, minStock: 8, image: "🫘", agencyIds: ["A002"] },
  { id: "P004", name: "Sunflower Oil", category: "Oils", price: 180, costPrice: 140, stock: 30, minStock: 5, image: "🫒", agencyIds: ["A003"] },
  { id: "P005", name: "Sugar", category: "Essentials", price: 42, costPrice: 30, stock: 100, minStock: 20, image: "🍬", agencyIds: ["A001"] },
  { id: "P006", name: "Tea Powder", category: "Beverages", price: 220, costPrice: 170, stock: 25, minStock: 5, image: "🍵", agencyIds: ["A003"] },
  { id: "P007", name: "Milk (1L)", category: "Dairy", price: 60, costPrice: 45, stock: 3, minStock: 10, image: "🥛", agencyIds: ["A004"] },
  { id: "P008", name: "Bread", category: "Bakery", price: 35, costPrice: 25, stock: 20, minStock: 5, image: "🍞", agencyIds: ["A004"] },
  { id: "P009", name: "Eggs (12pc)", category: "Dairy", price: 72, costPrice: 55, stock: 2, minStock: 5, image: "🥚", agencyIds: ["A004"] },
  { id: "P010", name: "Tomato (1kg)", category: "Vegetables", price: 30, costPrice: 20, stock: 60, minStock: 10, image: "🍅", agencyIds: ["A005"] },
  { id: "P011", name: "Onion (1kg)", category: "Vegetables", price: 25, costPrice: 18, stock: 70, minStock: 10, image: "🧅", agencyIds: ["A005"] },
  { id: "P012", name: "Potato (1kg)", category: "Vegetables", price: 22, costPrice: 16, stock: 80, minStock: 10, image: "🥔", agencyIds: ["A005"] },
];

export const agencies: Agency[] = [
  { id: "A001", name: "FreshGrain Distributors", contactPerson: "Mohan Das", phone: "9800000001", email: "mohan@freshgrain.com", address: "45 Market Road, Chennai", productsSupplied: ["Basmati Rice", "Whole Wheat Flour", "Sugar"] },
  { id: "A002", name: "PulseMart India", contactPerson: "Lakshmi Nair", phone: "9800000002", email: "lakshmi@pulsemart.com", address: "12 Grain Street, Mumbai", productsSupplied: ["Toor Dal", "Whole Wheat Flour"] },
  { id: "A003", name: "OilCraft Supplies", contactPerson: "Rajesh Gupta", phone: "9800000003", email: "rajesh@oilcraft.com", address: "78 Industrial Area, Delhi", productsSupplied: ["Sunflower Oil", "Tea Powder"] },
  { id: "A004", name: "DairyFresh Co.", contactPerson: "Anita Verma", phone: "9800000004", email: "anita@dairyfresh.com", address: "23 Milk Colony, Pune", productsSupplied: ["Milk", "Bread", "Eggs"] },
  { id: "A005", name: "VeggieLand Farms", contactPerson: "Suresh Babu", phone: "9800000005", email: "suresh@veggieland.com", address: "67 Farm Road, Bangalore", productsSupplied: ["Tomato", "Onion", "Potato"] },
];

export const dailySales: DailySale[] = [
  { date: "2026-02-18", totalAmount: 12450, billCount: 34, topProducts: ["Basmati Rice", "Milk"] },
  { date: "2026-02-19", totalAmount: 15200, billCount: 41, topProducts: ["Sugar", "Eggs"] },
  { date: "2026-02-20", totalAmount: 9800, billCount: 28, topProducts: ["Tea Powder", "Bread"] },
  { date: "2026-02-21", totalAmount: 18300, billCount: 52, topProducts: ["Sunflower Oil", "Toor Dal"] },
  { date: "2026-02-22", totalAmount: 14100, billCount: 38, topProducts: ["Onion", "Tomato"] },
  { date: "2026-02-23", totalAmount: 21500, billCount: 58, topProducts: ["Basmati Rice", "Sugar"] },
  { date: "2026-02-24", totalAmount: 16800, billCount: 45, topProducts: ["Milk", "Eggs"] },
];

export const monthlyReport = {
  totalSales: 485000,
  totalPurchaseCost: 310000,
  workerSalaries: 106000,
  otherExpenses: 25000,
  netProfit: 44000,
};
