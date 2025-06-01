# Transaction Reconciliation System

A NestJS application that compares transaction data between payment providers and internal systems to find missing transactions and data differences.

## What it does

- Upload two CSV files (source transactions and system transactions)
- Find transactions that exist in one file but not the other
- Detect differences in amounts and statuses between matching transactions
- Get a detailed report of all discrepancies


### Run the application
```bash
# Development mode
npm run start:dev

```

The API will be available at `http://localhost:8000`


## How to use

**POST** `/conciliation/reconcile`

Upload 2 CSV files using a form or API client like Postman.

### CSV File Format

**Source file (provider data):**
```csv
providerTransactionId,email,userId,provider,amount,currency,status,transactionType,paymentMethod,createdAt,updatedAt,providerReference,fraudRisk,details_invoiceId,details_customerName,details_description
txn_12345,user@example.com,user123,stripe,100.50,USD,completed,payment,card,2024-01-15T10:00:00Z,2024-01-15T10:01:00Z,ref123,low,inv456,John Doe,Payment for order
```

**System file (internal data):**
```csv
transactionId,userId,amount,currency,status,paymentMethod,createdAt,updatedAt,referenceId,metadata_orderId,metadata_description
txn_12345,user123,100.50,USD,completed,card,2024-01-15T10:00:00Z,2024-01-15T10:01:00Z,ref123,inv456,Payment for order
```

### Response

You'll get a JSON response with three sections:

```json
{
  "missing_in_internal": [
    {
      "providerTransactionId": "txn_99999",
      "amount": 200.00,
      "currency": "USD",
      "status": "succeeded"
    }
  ],
  "missing_in_source": [
    {
      "transactionId": "txn_77777",
      "amount": 50.00,
      "currency": "USD",
      "status": "completed"
    }
  ],
  "mismatched_transactions": [
    {
      "transactionId": "txn_12345",
      "discrepancies": {
        "amount": { "source": 150.00, "system": 145.00 },
        "status": { "source": "succeeded", "system": "completed" }
      }
    }
  ]
}
```

## Features

- **Fast processing**: Uses efficient algorithms for large files
- **Error detection**: Finds missing and mismatched transactions
- **Type safe**: Built with TypeScript for reliability
- **Easy to use**: Simple API with clear responses

## Implementation Details

### How it works internally

1. **File Processing**: Both CSV files are parsed simultaneously using parallel processing for better performance

2. **Data Mapping**: Creates hash maps (key-value pairs) for fast transaction lookups:
   - Source transactions: indexed by `providerTransactionId`
   - System transactions: indexed by `transactionId`

3. **Three-Phase Reconciliation**:
   - **Missing in Internal**: Finds source transactions that don't exist in system
   - **Missing in Source**: Finds system transactions that don't exist in source
   - **Mismatched Data**: Compares matching transactions for differences in amounts and status

### Key Technical Decisions

**Fast Lookups**: Uses Map data structure for O(1) lookup time instead of O(n) array searches
```typescript
// Instead of slow array search:
transactions.find(t => t.id === targetId) // O(n) time

// Uses fast Map lookup:
transactionMap.get(targetId) // O(1) time
```

**Parallel Processing**: Parses both CSV files at the same time
```typescript
const [sourceTransactions, systemTransactions] = await Promise.all([
  parseSourceFile(sourceFile),
  parseSystemFile(systemFile)
]);
```

**Financial Precision**: Uses 0.01 threshold for amount comparisons to handle floating-point precision issues
```typescript
if (Math.abs(amount1 - amount2) >= 0.01) {
  // Mark as amount discrepancy
}
```

**Memory Efficient**: Streams CSV data instead of loading entire files into memory, allowing handling of large files

### Architecture

```
Controller → Service → Reconciliation Logic
     ↓           ↓            ↓
File Upload → CSV Parsing → Data Comparison → Results
```

- **Controller**: Handles file uploads and validation
- **Service**: Orchestrates the reconciliation process
- **Core Logic**: Performs the actual comparison and discrepancy detection

