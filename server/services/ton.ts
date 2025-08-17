import { Address, Cell, internal, beginCell, contractAddress, toNano, fromNano } from "@ton/core";
import { TonClient, WalletContractV4 } from "@ton/ton";
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
  ): Promise<{ address: string; stateInit: string }> {
    try {
      // Real escrow: deploy per-order contract from precompiled code (ESCROW_CODE_B64)
      if (!this.walletContract || !this.platformSecretKey) throw new Error('Platform wallet not initialized');

      if (!process.env.ESCROW_CODE_B64) {
        throw new Error('ESCROW_CODE_B64 environment variable not set');
      }
      const codeCell = Cell.fromBase64(process.env.ESCROW_CODE_B64);

      const guarantorAddress = this.platformWallet!.address;
      const feeWalletAddress = Address.parse(process.env.FEE_RECEIVER_WALLET!);
      const buyerAddress = Address.parse(requesterAddress);
      const sellerAddress = Address.parse(providerAddress);

      const royaltyBps = 1000; // 10% in basis points
      const deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
      const gasReserveMin = toNano('0.1'); // 0.1 TON

      // (buyer, seller, guarantor, feeWallet, amount, royaltyBps, deadline, gasReserveMin, funded, disputed, closed)
      const dataCell = beginCell()
        .storeAddress(buyerAddress)
        .storeAddress(sellerAddress)
        .storeAddress(guarantorAddress)
        .storeAddress(feeWalletAddress)
        .storeCoins(amount) // amount
        .storeUint(royaltyBps, 16) // royaltyBps
        .storeUint(deadline, 64) // deadline
        .storeCoins(gasReserveMin) // gasReserveMin
        .storeUint(0, 1) // funded
        .storeUint(0, 1) // disputed
        .storeUint(0, 1) // closed
        .endCell();

      const workchain = 0;
      const addr = contractAddress(workchain, { code: codeCell, data: dataCell });

      // deploy with small grams to cover storage/fees
      const seqno: number = await this.walletContract.getSeqno();
      await this.walletContract.sendTransfer({
        secretKey: this.platformSecretKey,
        seqno: seqno,
        messages: [
          internal({
            to: addr,
            value: toNano('0.05'),
            bounce: false,
            init: { code: codeCell, data: dataCell },
            body: beginCell().storeUint(0, 32).endCell(),
          })
        ]
      });

      return {
        address: addr.toString({ urlSafe: true, bounceable: true }),
        stateInit: beginCell().storeRef(codeCell).storeRef(dataCell).endCell().toBoc().toString('base64')
      };
    } catch (error) {
        console.error('Failed to create escrow contract:', error);
        throw error;
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

  async approveEscrow(escrowAddress: string): Promise<void> {
    if (!this.walletContract || !this.platformSecretKey) throw new Error('Platform wallet not initialized');
    const seqno: number = await this.walletContract.getSeqno();

    // op-code for APPROVE is 20
    const body = beginCell()
      .storeUint(20, 32) // op: OP_APPROVE
      .endCell();

    await this.walletContract.sendTransfer({
      secretKey: this.platformSecretKey,
      seqno: seqno,
      messages: [
        internal({
          to: Address.parse(escrowAddress),
          value: toNano('0.05'),
          bounce: true,
          body: body,
        }),
      ],
    });
    console.log(`[TON] Approve command sent to escrow: ${escrowAddress}`);
  }

  async releaseEscrow(contractAddress: string, providerAddress: string, amount: bigint, comment?: string): Promise<boolean> {
    try {
      if (!this.walletContract || !this.platformSecretKey) throw new Error('Platform wallet not initialized');
      const seqno: number = await this.walletContract.getSeqno();
      // op 1: transfer to seller
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
            value: toNano('0.05'),
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
      // op 2: transfer back to buyer
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
            value: toNano('0.05'),
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
      // op 3: guarantor claims royalties and destroys contract
      const body = beginCell()
        .storeUint(3, 32) // op-code
        .storeUint(0, 64) // query_id
        .endCell();
      await this.walletContract.sendTransfer({
        secretKey: this.platformSecretKey,
        seqno,
        messages: [
          internal({
            to: Address.parse(contractAddress),
            value: toNano('0.05'),
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
            value: toNano('0.05'),
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

  async getWalletBalance(address: string): Promise<bigint> {
    try {
      const addr = Address.parse(address);
      const balance = await this.client.getBalance(addr);
      return balance;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return BigInt(0);
    }
  }

  async checkSufficientBalance(address: string, requiredAmount: bigint): Promise<{ sufficient: boolean; balance: bigint; required: bigint }> {
    try {
      const balance = await this.getWalletBalance(address);
      const gasReserve = toNano('0.1'); // Reserve 0.1 TON for gas fees
      const totalRequired = requiredAmount + gasReserve;
      
      return {
        sufficient: balance >= totalRequired,
        balance,
        required: totalRequired
      };
    } catch (error) {
      console.error('Failed to check wallet balance:', error);
      return {
        sufficient: false,
        balance: BigInt(0),
        required: requiredAmount
      };
    }
  }

  // Convert nanoTON to TON
  nanoToTon(nano: bigint): string {
    return fromNano(nano);
  }
}

export const tonService = new TonService();