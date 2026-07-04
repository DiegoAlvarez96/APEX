export type FinanceTransactionInput = {
  type: string;
  category: string;
  amount: number;
  currency?: string;
  occurredAt?: Date;
  metadata?: Record<string, unknown>;
};
