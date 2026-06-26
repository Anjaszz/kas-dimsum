export type TransactionType = 'pemasukan' | 'pengeluaran';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  image: string | null;
  batch_id?: string | null;
}

export interface Batch {
  id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  total_income: number;
  total_expense: number;
  total_balance: number;
  created_at: string;
}

export interface EmployeeStat {
  name: string;
  daysWorked: number;
  totalGross: number;
  splitGross: number;
  avgGross: number;
  history: any[];
  isActive?: boolean;
}

export interface EmployeeBatch {
  id: string;
  batchName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  stats: Omit<EmployeeStat, 'history'>[];
}
