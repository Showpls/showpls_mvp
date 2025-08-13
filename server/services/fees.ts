// Fee calculation service - single source of truth for all monetary calculations

const NANO_TON = 1000000000; // 1 TON = 10^9 nano-TON

export interface FeeCalculation {
  budgetNanoTon: bigint;
  platformFeeNanoTon: bigint;
  providerReceiveNanoTon: bigint;
  displayValues: {
    budget: string;
    platformFee: string;
    providerReceives: string;
  };
}

export class FeeService {
  static DEFAULT_PLATFORM_FEE_BPS = 250; // 2.5%

  /**
   * Convert TON to nano-TON for storage
   */
  static tonToNanoTon(tonAmount: number | string): bigint {
    const ton = typeof tonAmount === 'string' ? parseFloat(tonAmount) : tonAmount;
    return BigInt(Math.floor(ton * NANO_TON));
  }

  /**
   * Convert nano-TON to TON for display
   */
  static nanoTonToTon(nanoTon: bigint): string {
    return (Number(nanoTon) / NANO_TON).toFixed(9);
  }

  /**
   * Calculate all fees for an order
   */
  static calculateFees(
    budgetTon: number | string,
    platformFeeBps: number = FeeService.DEFAULT_PLATFORM_FEE_BPS
  ): FeeCalculation {
    const budgetNanoTon = FeeService.tonToNanoTon(budgetTon);
    
    // Calculate platform fee in basis points
    const platformFeeNanoTon = (budgetNanoTon * BigInt(platformFeeBps)) / BigInt(10000);
    
    // Provider receives budget minus platform fee
    const providerReceiveNanoTon = budgetNanoTon - platformFeeNanoTon;

    return {
      budgetNanoTon,
      platformFeeNanoTon,
      providerReceiveNanoTon,
      displayValues: {
        budget: FeeService.nanoTonToTon(budgetNanoTon),
        platformFee: FeeService.nanoTonToTon(platformFeeNanoTon),
        providerReceives: FeeService.nanoTonToTon(providerReceiveNanoTon),
      }
    };
  }

  /**
   * Format nano-TON for user display (removes trailing zeros)
   */
  static formatTonForDisplay(nanoTon: bigint): string {
    const ton = FeeService.nanoTonToTon(nanoTon);
    return parseFloat(ton).toString() + ' TON';
  }

  /**
   * Validate minimum order amount (0.1 TON minimum)
   */
  static validateMinimumOrder(tonAmount: number | string): boolean {
    const nanoTon = FeeService.tonToNanoTon(tonAmount);
    const minimumNanoTon = BigInt(0.1 * NANO_TON);
    return nanoTon >= minimumNanoTon;
  }

  /**
   * Calculate escrow amounts for smart contract
   */
  static getEscrowAmounts(budgetNanoTon: bigint, platformFeeBps: number) {
    const platformFeeNanoTon = (budgetNanoTon * BigInt(platformFeeBps)) / BigInt(10000);
    const providerAmount = budgetNanoTon - platformFeeNanoTon;
    
    return {
      totalEscrowAmount: budgetNanoTon,
      platformFeeAmount: platformFeeNanoTon,
      providerAmount,
    };
  }
}

// type already exported above