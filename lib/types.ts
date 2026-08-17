export type Customer = {
  id: number;
  name: string;
  email: string;
  city: string;
  country: string | null;
};

export type OrderStatus =
  | 'received'
  | 'confirmed'
  | 'stitching'
  | 'partially_dispatched'
  | 'dispatched'
  | 'cancelled';

export type OrderSummary = {
  id: number;
  order_number: string;
  status: OrderStatus;
  catalogue: { id: number; name: string };
  total_pieces: number;
  total_amount: string;
  total_paid: string;
  outstanding_balance: string;
  is_fully_dispatched: boolean;
  created_at: string;
};

export type OrderItem = {
  id: number;
  design: { id: number; name: string; photo_url: string | null };
  qty_xs: number;
  qty_s: number;
  qty_m: number;
  qty_l: number;
  qty_xl: number;
  total_qty: number;
  unit_price: string;
  total_amount: string;
};

export type Payment = {
  id: number;
  payment_id: string;
  payment_type: string;
  amount: string;
  payment_date: string;
  bank_account: string | null;
  notes: string | null;
};

export type DispatchBatchItem = {
  design: string;
  size: string;
  quantity: number;
};

export type DispatchBatch = {
  id: number;
  batch_number: number;
  dispatch_date: string;
  shipping_address: string;
  cargo_document_url: string | null;
  total_pieces: number;
  items: DispatchBatchItem[];
};

export type SizeBreakdown = {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
};

export type OrderDetail = {
  id: number;
  order_number: string;
  status: OrderStatus;
  catalogue: { id: number; name: string; hd_gallery_url: string | null };
  total_amount: string;
  total_paid: string;
  outstanding_balance: string;
  is_fully_dispatched: boolean;
  can_be_dispatched: boolean;
  size_breakdown: SizeBreakdown;
  total_pieces: number;
  created_at: string;
  items: OrderItem[];
  payments: Payment[];
  dispatch_batches: DispatchBatch[];
};

export type LedgerEntry = {
  id: number;
  transaction_type: string;
  amount: string;
  running_advance_balance: string;
  order_number: string | null;
  payment_id: string | null;
  created_at: string;
};

export type CatalogueSummary = {
  id: number;
  name: string;
  cover_photo_url: string | null;
  quantity_benchmark: number | null;
  qty_per_design: number;
  number_of_designs: number;
  total_pieces: number;
  available_pieces: number;
  sold_out: boolean;
  already_ordered: boolean;
};

export type Design = {
  id: number;
  name: string;
  photo_url: string | null;
  selling_price: string;
  discount_price: string | null;
};

export type CatalogueDetail = CatalogueSummary & {
  designs: Design[];
};

// The one set of XS/S/M/L/XL quantities entered for a whole catalogue —
// applied to every design in it. See CLAUDE.md §4.
export type QuoteLine = {
  design_id: number;
  design: string;
  unit_price: number;
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  pieces: number;
  line_total: number;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  sent_at: string;
  read_at: string | null;
};

// Unlike Order money fields, the quote endpoint returns plain integers
// (whole rupees), not decimal strings — formatCurrency handles both.
export type Quote = {
  pieces_per_design: number;
  total_pieces: number;
  design_count: number;
  uses_discount: boolean;
  quantity_benchmark: number | null;
  total_amount: number;
  sizes: SizeBreakdown;
  lines: QuoteLine[];
};
