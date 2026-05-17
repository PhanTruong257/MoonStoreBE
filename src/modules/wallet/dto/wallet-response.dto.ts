export interface WalletSummaryDto {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export interface WalletTransactionDto {
  id: number;
  type: string;
  amount: number;
  fee: number;
  net: number;
  description: string;
  orderGroupId: number | null;
  createdAt: string;
}

export interface WithdrawalRequestDto {
  id: number;
  amount: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  status: string;
  note: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface WalletDetailResponseDto {
  wallet: WalletSummaryDto;
  transactions: WalletTransactionDto[];
  withdrawals: WithdrawalRequestDto[];
}
