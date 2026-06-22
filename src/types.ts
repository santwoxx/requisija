export interface RequisitionItem {
  id: string; // unique ID for React list key and edits
  name: string;
  quantity: string;
  description: string;
  estimatedUnitPrice: number;
}

export interface Requisition {
  id: string;
  requisitionNumber: string; // formatted identifier e.g. WA-2026-0032
  requesterName: string;
  sector: string;
  urgency: 'Alta' | 'Média' | 'Baixa';
  justification: string;
  items: RequisitionItem[];
  observationsToApprover: string;
  createdAt: string;
  whatsappContact?: string; // stored target number for WhatsApp
  companyName?: string; // name of the client company (dynamic whitelabel)
  companySub?: string;  // corporate activity / tagline
  companyCnpj?: string; // corporate registration number
  paymentTerms?: string; // Preferred payment structure (ex: Boleto 30 dias)
}

export interface CompanySettings {
  name: string;
  tagline: string;
  cnpj: string;
  contactEmail: string;
  contactPhone: string;
  accentColor: string; // Hex color for printing accents if customized
  logoUrl?: string; // Image URL of the logo
}

export interface HistoryRecord {
  id: string;
  requisitionNumber: string;
  requesterName: string;
  sector: string;
  createdAt: string;
  itemsCount: number;
  data: Requisition; // deep copy of content
}
