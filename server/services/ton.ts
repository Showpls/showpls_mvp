import { Address, Cell, TonClient, WalletContractV4, internal, beginCell, contractAddress } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";

export interface EscrowContract {
  address: Address;
  orderId: string;
  amount: bigint;
  requesterAddress: Address;
  providerAddress: Address;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed';
}

export interface DisputeInfo {
  orderId: string;
  disputeId: string;
  reason: string;
  evidence: string[];
  status: 'open' | 'in_review' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  arbiterDecision?: 'approve' | 'refund' | 'partial';
}

export class TonService {
  private client: TonClient;
  private platformWallet?: WalletContractV4;
  private platformSecretKey?: Uint8Array;
  private walletContract?: any;

  constructor() {
    // Initialize TON client for testnet
    this.client = new TonClient({
      endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
      apiKey: process.env.TON_API_KEY
    });
    
    this.initializePlatformWallet();
  }

  private async initializePlatformWallet() {
    if (!process.env.TON_PLATFORM_WALLET) {
      console.warn('TON_PLATFORM_WALLET not set - TON functionality will be limited');
      return;
    }

    try {
      const mnemonic = process.env.TON_PLATFORM_WALLET.split(' ');
      const keyPair = await mnemonicToPrivateKey(mnemonic);
      this.platformSecretKey = keyPair.secretKey;
      this.platformWallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
      });
      // open wallet contract
      this.walletContract = this.client.open(this.platformWallet);
    } catch (error) {
      console.error('Failed to initialize platform wallet:', error);
    }
  }

  async createEscrowContract(
    orderId: string, 
    amount: bigint, 
    requesterAddress: string, 
    providerAddress: string
  ): Promise<EscrowContract> {
    try {
      // Real escrow: deploy per-order contract from precompiled code (ESCROW_CODE_B64)
      if (!this.walletContract || !this.platformSecretKey) throw new Error('Platform wallet not initialized');

      const codeB64 = process.env.ESCROW_CODE_B64;
      if (!codeB64) throw new Error('ESCROW_CODE_B64 not set (base64 of compiled escrow .boc)');
      const codeCell = Cell.fromBase64(codeB64);

      const requester = Address.parse(requesterAddress);
      const provider = Address.parse(providerAddress);
      const feeAddr = process.env.FEE_RECEIVER_WALLET ? Address.parse(process.env.FEE_RECEIVER_WALLET) : this.platformWallet!.address;

      // New contract data: amount, royalty_percentage, is_deal_ended, guarantor_address, seller_address, buyer_address
      const dataCell = beginCell()
        .storeCoins(amount) // amount
        .storeUint(10, 32) // royalty_percentage: 10%
        .storeUint(0, 1)   // is_deal_ended: false
        .storeAddress(this.platformWallet!.address) // guarantor_address
        .storeAddress(provider) // seller_address
        .storeAddress(requester) // buyer_address
        .endCell();

      const workchain = 0;
      const addr = contractAddress(workchain, { code: codeCell, data: dataCell });

      // deploy with small grams to cover storage/fees
      const seqno: number = await this.walletContract.getSeqno();
      await this.walletContract.sendTransfer({
        secretKey: this.platformSecretKey,
        seqno,
        messages: [
          internal({
            to: addr,
            value: this.tonToNano(0.05),
            bounce: false,
            init: { code: codeCell, data: dataCell },
            body: beginCell().storeUint(0, 32).endCell(),
          })
        ]
      });

      return {
        address: addr,
        orderId,
        amount,
        requesterAddress: requester,
        providerAddress: provider,
        status: 'pending',
      };
    } catch (error) {
      console.error('Failed to create escrow contract:', error);
      throw new Error('Failed to create escrow contract');
    }
  }

  async fundEscrow(contractAddress: string, amount: bigint): Promise<boolean> {
    try {
      if (!this.walletContract || !this.platformSecretKey) throw new Error('Platform wallet not initialized');
      const seqno: number = await this.walletContract.getSeqno();
      await this.walletContract.sendTransfer({
        secretKey: this.platformSecretKey,
        seqno,
        messages: [
          internal({
            to: Address.parse(contractAddress),
            value: amount,
            bounce: true,
          })
        ]
      });
      return true;
    } catch (error) {
      console.error('Failed to fund escrow:', error);
      return false;
    }
  }

  async releaseEscrow(contractAddress: string, providerAddress: string, amount: bigint, comment?: string): Promise<boolean> {
    try {
      if (!this.walletContract || !this.platformSecretKey) throw new Error('Platform wallet not initialized');
      const seqno: number = await this.walletContract.getSeqno();
      // op 0: transfer to seller
      const body = beginCell()
        .storeUint(0, 32) // op-code
        .storeUint(0, 64) // query_id
        .endCell();
      await this.walletContract.sendTransfer({
        secretKey: this.platformSecretKey,
        seqno,
        messages: [
          internal({
            to: Address.parse(contractAddress),
            value: this.tonToNano(0.05),
            bounce: true,
            body,
          })
        ]
      });
      return true;
    } catch (error) {
      console.error('Failed to release escrow:', error);
      return false;
    }
  }

  async refundEscrow(contractAddress: string, requesterAddress: string, amount: bigint, comment?: string): Promise<boolean> {
    try {
      if (!this.walletContract || !this.platformSecretKey) throw new Error('Platform wallet not initialized');
      const seqno: number = await this.walletContract.getSeqno();
      // op 1: transfer back to buyer
      const body = beginCell()
        .storeUint(1, 32) // op-code
        .storeUint(0, 64) // query_id
        .endCell();
      await this.walletContract.sendTransfer({
        secretKey: this.platformSecretKey,
        seqno,
        messages: [
          internal({
            to: Address.parse(contractAddress),
            value: this.tonToNano(0.05),
            bounce: true,
            body,
          })
        ]
      });
      return true;
    } catch (error) {
      console.error('Failed to refund escrow:', error);
      return false;
    }
  }

  async claimRoyalties(contractAddress: string): Promise<boolean> {
    try {
      if (!this.walletContract || !this.platformSecretKey) throw new Error('Platform wallet not initialized');
      const seqno: number = await this.walletContract.getSeqno();
      // op 2: guarantor claims royalties and destroys contract
      const body = beginCell()
        .storeUint(2, 32) // op-code
        .storeUint(0, 64) // query_id
        .endCell();
      await this.walletContract.sendTransfer({
        secretKey: this.platformSecretKey,
        seqno,
        messages: [
          internal({
            to: Address.parse(contractAddress),
            value: this.tonToNano(0.05),
            bounce: true,
            body,
          })
        ]
      });
      return true;
    } catch (error) {
      console.error('Failed to claim royalties:', error);
      return false;
    }
  }

  async pauseEscrow(contractAddress: string): Promise<boolean> {
    try {
      if (!this.walletContract || !this.platformSecretKey) throw new Error('Platform wallet not initialized');
      const seqno: number = await this.walletContract.getSeqno();
      const body = beginCell().storeUint(0xA3, 32).endCell();
      await this.walletContract.sendTransfer({
        secretKey: this.platformSecretKey,
        seqno,
        messages: [
          internal({
            to: Address.parse(contractAddress),
            value: this.tonToNano(0.05),
            bounce: true,
            body,
          })
        ]
      });
      return true;
    } catch (error) {
      console.error('Failed to pause escrow:', error);
      return false;
    }
  }

  async createDispute(
    orderId: string,
    reason: string,
    evidence: string[]
  ): Promise<DisputeInfo> {
    try {
      const dispute: DisputeInfo = {
        orderId,
        disputeId: `dispute_${Date.now()}_${orderId}`,
        reason,
        evidence,
        status: 'open',
        createdAt: new Date()
      };

      // In a real implementation, this would create a dispute record on-chain
      console.log(`Creating dispute for order ${orderId}:`, dispute);
      
      return dispute;
    } catch (error) {
      console.error('Failed to create dispute:', error);
      throw new Error('Failed to create dispute');
    }
  }

  async resolveDispute(
    disputeId: string,
    decision: 'approve' | 'refund' | 'partial',
    resolution: string
  ): Promise<boolean> {
    try {
      // In a real implementation, this would update the dispute on-chain
      console.log(`Resolving dispute ${disputeId} with decision: ${decision}`);
      return true;
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      return false;
    }
  }

  async getEscrowStatus(contractAddress: string): Promise<string> {
    try {
      // Check inbound transactions to escrow address via toncenter
      const address = Address.parse(contractAddress).toString({ urlSafe: true, bounceable: true });
      const apiKey = process.env.TON_API_KEY;
      const url = `https://testnet.toncenter.com/api/v2/getTransactions?address=${address}&limit=20${apiKey ? `&api_key=${apiKey}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json?.ok && Array.isArray(json.result)) {
        const inbound = json.result.find((tx: any) => tx.in_msg && tx.in_msg.value && Number(tx.in_msg.value) > 0);
        return inbound ? 'funded' : 'pending';
      }
      return 'pending';
    } catch (error) {
      console.error('Failed to get escrow status:', error);
      return 'unknown';
    }
  }

  async validateWalletAddress(address: string): Promise<boolean> {
    try {
      Address.parse(address);
      return true;
    } catch {
      return false;
    }
  }

  // Convert TON to nanoTON
  tonToNano(ton: number): bigint {
    return BigInt(Math.floor(ton * 1000000000));
  }

  // Convert nanoTON to TON
  nanoToTon(nano: bigint): number {
    return Number(nano) / 1000000000;
  }
}

export const tonService = new TonService();