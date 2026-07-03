// ──────────────────────────────────────────────
// Domain Types for Teringo v3
// Multi-warehouse, Incoterms, Brokers
// ──────────────────────────────────────────────

// ─── Enums ───
export type Gender = 'Male' | 'Female' | 'Unisex';
export type Format = 'Tester' | 'Regular' | 'Set' | 'Vial' | 'Miniature';
export type Concentration = 'EDP' | 'EDT' | 'EDC' | 'Parfum' | 'Absolute' | 'Cologne';
export type EntityType = 'Supplier' | 'Client' | 'Both' | 'Broker';
export type TradeType = 'Offer' | 'Bid';
export type TradeStatus = 'Draft' | 'Active' | 'Accepted' | 'Rejected' | 'Expired' | 'Negotiating';
export type InvoiceStatus = 'Pending' | 'Approved' | 'Shipped' | 'Paid' | 'Cancelled' | 'Proforma';
export type Incoterm = 'EXW' | 'FOB' | 'CIF' | 'DDP' | 'CIP' | 'CPT' | 'DAP';
export type Role = 'admin' | 'commercial' | 'viewer';

// ─── Brand ───
export interface Brand {
  id: string;
  name: string;
  category: 'Luxury' | 'Niche' | 'Mass' | 'Independent';
  country?: string;
  created_at: string;
}

// ─── Product (SKU Maestro) ───
export interface Product {
  id: string;
  brand_id: string;
  brand_name?: string;
  brand_category?: string;
  name: string;
  line?: string;
  gender: Gender;
  format: Format;
  concentration: Concentration;
  size_ml: number;
  ean: string;
  market_price: number;
  cost_price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Partner (Supplier / Client / Broker) ───
export interface Partner {
  id: string;
  name: string;
  type: EntityType;
  email?: string;
  phone?: string;
  country?: string;
  address?: string;
  credit_limit: number;
  payment_terms: string;
  is_active: boolean;
  broker_fee_pct?: number;
  created_at: string;
}

// ─── Warehouse ───
export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string;
  is_active: boolean;
  created_at: string;
}

// ─── Inventory (with batch traceability) ───
export interface Inventory {
  id: string;
  product_id: string;
  product_name?: string;
  warehouse_id: string;
  warehouse_name?: string;
  partner_id?: string;
  partner_name?: string;
  quantity: number;
  batch_code: string;
  cost_price: number;
  expiry_date?: string;
  warehouse_location?: string;
  received_at: string;
}

// ─── Trading List (Offers / Bids with Incoterms) ───
export interface TradingItem {
  id: string;
  type: TradeType;
  partner_id: string;
  partner_name?: string;
  product_id: string;
  product_name?: string;
  brand_name?: string;
  quantity: number;
  price_unit: number;
  total_amount: number;
  incoterm: Incoterm;
  market_price: number;
  margin_pct: number;
  margin_amount: number;
  status: TradeStatus;
  valid_until?: string;
  notes?: string;
  created_at: string;
}

// ─── Invoice ───
export interface Invoice {
  id: string;
  partner_id: string;
  partner_name?: string;
  invoice_number: string;
  type: TradeType;
  incoterm: Incoterm;
  total_net: number;
  tax_percent: number;
  tax_amount: number;
  total_gross: number;
  status: InvoiceStatus;
  due_date?: string;
  notes?: string;
  created_at: string;
}

// ─── Invoice Line Item ───
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ─── Dashboard KPIs ───
export interface DashboardKPI {
  total_sales: number;
  sales_change: number;
  active_offers: number;
  pending_bids: number;
  low_stock_count: number;
  active_partners: number;
  avg_margin: number;
  monthly_data: { month: string; sales: number; purchases: number }[];
}

// ─── API Response ───
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  count?: number;
}

// ─── User Profile ───
export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  name?: string;
  avatar_url?: string;
}
