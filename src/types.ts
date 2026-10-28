export interface Product {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  price: number;
  color: 'orange' | 'blue' | 'green' | 'yellow' | 'pink' | 'purple';
  category?: string;
}

export type ActivityType = 'sold' | 'received' | 'returned' | 'damaged' | 'credit' | 'payment';

export interface ActivityItem {
  name: string;
  quantity: number;
  before: number;
  after: number;
  unit: string;
  price: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  items?: ActivityItem[];
  customer?: string;
  amount?: number;
  balance?: number;
  createdAt: string; // ISO string
  actor?: string;
  channel?: string;
}

export interface Customer {
  id: string;
  name: string;
  balance: number;
  phone?: string;
  updatedAt: string;
}

export type AuditCategory = 'inventory' | 'financial' | 'settings' | 'ai' | 'security';
export type AuditSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface AuditDiff {
  entity: string;
  field: string;
  before: string | number;
  after: string | number;
  unit?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  category: AuditCategory;
  action: string;
  actor: string;
  summary: string;
  diffs?: AuditDiff[];
  severity: AuditSeverity;
  channel: 'voice_kannada' | 'voice_english' | 'quick_action' | 'chat_command' | 'manual_ui' | 'system';
  metadata?: Record<string, any>;
}

export interface ShopProfile {
  name: string;
  ownerName: string;
  phone: string;
  supplierPhone: string;
  upiId: string;
  currentRole: 'Owner' | 'Cashier' | 'Helper';
  address: string;
}

export interface InventoryInsight {
  productName: string;
  severity: 'critical' | 'warning' | 'optimal';
  daysLeftEstimate: number;
  recommendation: string;
  suggestedReorderQty: number;
}

export interface CreditRiskAnalysis {
  riskLevel: 'Low' | 'Medium' | 'High';
  totalExposure: number;
  advice: string;
  whatsappReminderEnglish: string;
  whatsappReminderKannada: string;
}

export interface ProfitOpportunity {
  title: string;
  impact: 'High' | 'Medium' | 'Quick Win';
  description: string;
}

export interface ActionPlanItem {
  priority: number;
  title: string;
  action: string;
  category: 'reorder' | 'udhaar' | 'pricing' | 'stock';
}

export interface StoreAnalysis {
  healthScore: number;
  healthStatus: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical Risk';
  executiveSummary: string;
  kannadaSummary: string;
  inventoryInsights: InventoryInsight[];
  creditRiskAnalysis: CreditRiskAnalysis;
  profitOpportunities: ProfitOpportunity[];
  actionPlan: ActionPlanItem[];
}
