export class SourceTransactionDto {
  providerTransactionId: string;
  email: string;
  userId: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  transactionType: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  providerReference: string;
  fraudRisk: string;
  details_invoiceId: string;
  details_customerName: string;
  details_description: string;
}

export class SystemTransactionDto {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  referenceId: string;
  metadata_orderId: string;
  metadata_description: string;
}

export class DiscrepancyDto {
  amount?: { source: number; system: number };
  status?: { source: string; system: string };
}

interface MissingInternalTransaction {
  providerTransactionId: string;
  amount: number;
  currency: string;
  status: string;
}

interface MissingSourceTransaction {
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
}

interface MismatchedTransaction {
  transactionId: string;
  discrepancies: DiscrepancyDto;
}

export class ReconciliationResultDto {
  missing_in_internal: MissingInternalTransaction[];
  missing_in_source: MissingSourceTransaction[];
  mismatched_transactions: MismatchedTransaction[];
} 