import { Injectable } from '@nestjs/common';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import {
  SourceTransactionDto,
  SystemTransactionDto,
  ReconciliationResultDto,
  DiscrepancyDto
} from './dto/conciliation.dto';

@Injectable()
export class ConciliationService {
  async reconcileTransactions(
    sourceFile: Express.Multer.File,
    systemFile: Express.Multer.File,
  ): Promise<ReconciliationResultDto> {
    const [sourceTransactions, systemTransactions] = await Promise.all([
      this.parseCSVFromBuffer<SourceTransactionDto>(sourceFile.buffer, (row) => ({
        ...row,
        amount: parseFloat(row.amount),
      })),
      this.parseCSVFromBuffer<SystemTransactionDto>(systemFile.buffer, (row) => ({
        ...row,
        amount: parseFloat(row.amount),
      })),
    ]);

    return this.performReconciliation(sourceTransactions, systemTransactions);
  }

  private parseCSVFromBuffer<T>(
    buffer: Buffer,
    transform?: (row: any) => T,
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const results: T[] = [];
      const stream = Readable.from(buffer.toString());

      stream
        .pipe(csv())
        .on('data', (data) => {
          const transformedData = transform ? transform(data) : data;
          results.push(transformedData);
        })
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  private performReconciliation(
    sourceTransactions: SourceTransactionDto[],
    systemTransactions: SystemTransactionDto[],
  ): ReconciliationResultDto {
    const result: ReconciliationResultDto = {
      missing_in_internal: [],
      missing_in_source: [],
      mismatched_transactions: [],
    };

    // Create maps for efficient lookup
    const { systemTransactionMap, sourceTransactionMap } = this.createTransactionMaps(
      sourceTransactions, 
      systemTransactions
    );

    // Find missing transactions
    result.missing_in_internal = this.findMissingInInternal(sourceTransactions, systemTransactionMap);
    result.missing_in_source = this.findMissingInSource(systemTransactions, sourceTransactionMap);
    
    // Find mismatched transactions
    result.mismatched_transactions = this.findMismatchedTransactions(sourceTransactions, systemTransactionMap);

    return result;
  }

  private createTransactionMaps(
    sourceTransactions: SourceTransactionDto[],
    systemTransactions: SystemTransactionDto[],
  ) {
    const systemTransactionMap = new Map<string, SystemTransactionDto>();
    const sourceTransactionMap = new Map<string, SourceTransactionDto>();
    
    // Map system transactions by transaction ID
    systemTransactions.forEach(transaction => {
      systemTransactionMap.set(transaction.transactionId, transaction);
    });

    // Map source transactions by provider transaction ID
    sourceTransactions.forEach(transaction => {
      sourceTransactionMap.set(transaction.providerTransactionId, transaction);
    });

    return { systemTransactionMap, sourceTransactionMap };
  }

  private findMissingInInternal(
    sourceTransactions: SourceTransactionDto[],
    systemTransactionMap: Map<string, SystemTransactionDto>,
  ): any[] {
    const missing: any[] = [];

    sourceTransactions.forEach(sourceTransaction => {
      const matchingSystemTransaction = systemTransactionMap.get(sourceTransaction.providerTransactionId);
      
      if (!matchingSystemTransaction) {
        missing.push({
          providerTransactionId: sourceTransaction.providerTransactionId,
          amount: sourceTransaction.amount,
          currency: sourceTransaction.currency,
          status: sourceTransaction.status,
        });
      }
    });

    return missing;
  }

  private findMissingInSource(
    systemTransactions: SystemTransactionDto[],
    sourceTransactionMap: Map<string, SourceTransactionDto>,
  ): any[] {
    const missing: any[] = [];

    systemTransactions.forEach(systemTransaction => {
      const matchingSourceTransaction = sourceTransactionMap.get(systemTransaction.transactionId);
      
      if (!matchingSourceTransaction) {
        missing.push({
          transactionId: systemTransaction.transactionId,
          amount: systemTransaction.amount,
          currency: systemTransaction.currency,
          status: systemTransaction.status,
        });
      }
    });

    return missing;
  }

  private findMismatchedTransactions(
    sourceTransactions: SourceTransactionDto[],
    systemTransactionMap: Map<string, SystemTransactionDto>,
  ): any[] {
    const mismatched: any[] = [];

    sourceTransactions.forEach(sourceTransaction => {
      const matchingSystemTransaction = systemTransactionMap.get(sourceTransaction.providerTransactionId);
      
      if (matchingSystemTransaction) {
        const discrepancies: DiscrepancyDto = {};
        
        // Check amount mismatch
        if (Math.abs(matchingSystemTransaction.amount - sourceTransaction.amount) >= 0.01) {
          discrepancies.amount = {
            source: sourceTransaction.amount,
            system: matchingSystemTransaction.amount,
          };
        }
        
        // Check status mismatch
        if (matchingSystemTransaction.status !== sourceTransaction.status) {
          discrepancies.status = {
            source: sourceTransaction.status,
            system: matchingSystemTransaction.status,
          };
        }
        
        // If there are discrepancies, add to mismatched transactions
        if (Object.keys(discrepancies).length > 0) {
          mismatched.push({
            transactionId: sourceTransaction.providerTransactionId,
            discrepancies,
          });
        }
      }
    });

    return mismatched;
  }
}
