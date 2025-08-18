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
      const addr = this.platformWallet.address.toString({ urlSafe: true, bounceable: true });
      console.log(`[TON] Platform wallet address: ${addr}`);
    } catch (error) {
      console.error('Failed to initialize platform wallet:', error);
    }
  }

  private async ensurePlatformWalletReady(): Promise<void> {
    if (!this.platformWallet || !this.walletContract) throw new Error('Platform wallet not initialized');
    const address = this.platformWallet.address;
    try {
      // Check balance to infer deployment
      const balance = await this.client.getBalance(address);
      const info = await this.client.getContractState(address);
      const addrStr = address.toString({ urlSafe: true, bounceable: true });
      if (!info || info.state !== 'active') {
        throw new Error(`Platform wallet not deployed on chain. Address: ${addrStr}`);
      }
      if (balance <= BigInt(0)) {
        throw new Error(`Platform wallet has zero balance. Top up testnet wallet: ${addrStr}`);
      }
      // Probe seqno (will throw if wallet not active)
      await this.walletContract.getSeqno();
    } catch (e) {
      throw e instanceof Error ? e : new Error('Platform wallet not ready');
    }
  }

  async createEscrowContract(
    orderId: string,
    amount: bigint,
    requesterAddress: string,
    providerAddress: string
  ): Promise<{ address: string; stateInit: string }> {
    try {
      // Build stateInit for escrow; no on-chain action here
      
      // Basic input logging for diagnostics
      console.log('[TON] createEscrowContract called', {
        orderId,
        amountNano: amount.toString(),
        amountTon: fromNano(amount),
        requesterAddress,
        providerAddress,
      });

      if (!process.env.ESCROW_CODE_B64 || process.env.ESCROW_CODE_B64.trim().length === 0) {
        throw new Error('ESCROW_CODE_B64 environment variable not set');
      }
      let codeCell: Cell;
      try {
        codeCell = Cell.fromBase64(process.env.ESCROW_CODE_B64);
      } catch (e) {
        console.error('[TON] Invalid ESCROW_CODE_B64 value');
        throw new Error('Invalid ESCROW_CODE_B64 (cannot parse base64 cell)');
      }

      if (!process.env.FEE_RECEIVER_WALLET) {
        throw new Error('FEE_RECEIVER_WALLET environment variable not set');
      }

      // Resolve guarantor address from initialized platform wallet or env var
      let guarantorAddress: Address;
      if (this.platformWallet) {
        guarantorAddress = this.platformWallet.address;
      } else if (process.env.GUARANTOR_ADDRESS) {
        try {
          guarantorAddress = Address.parse(process.env.GUARANTOR_ADDRESS);
        } catch (e) {
          console.error('[TON] Invalid GUARANTOR_ADDRESS:', process.env.GUARANTOR_ADDRESS);
          throw new Error('Invalid GUARANTOR_ADDRESS');
        }
      } else {
        throw new Error('Guarantor address not configured. Set TON_PLATFORM_WALLET or GUARANTOR_ADDRESS');
      }
      let feeWalletAddress: Address;
      let buyerAddress: Address;
      let sellerAddress: Address;
      try {
        feeWalletAddress = Address.parse(process.env.FEE_RECEIVER_WALLET);
      } catch (e) {
        console.error('[TON] Invalid FEE_RECEIVER_WALLET:', process.env.FEE_RECEIVER_WALLET);
        throw new Error('Invalid FEE_RECEIVER_WALLET');
      }
      try {
        buyerAddress = Address.parse(requesterAddress);
      } catch (e) {
        console.error('[TON] Invalid requesterAddress:', requesterAddress);
        throw new Error('Invalid requester wallet address');
      }
      try {
        sellerAddress = Address.parse(providerAddress);
      } catch (e) {
        console.error('[TON] Invalid providerAddress:', providerAddress);
        throw new Error('Invalid provider wallet address');
      }

      const royaltyBps = 1000; // 10% in basis points
      const deadline = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
      const gasReserveMin = toNano('0.1'); // 0.1 TON

      // To avoid root cell overflow, store buyer & seller in root and pack guarantor & fee wallet into a ref
      const addrRef = beginCell()
        .storeAddress(guarantorAddress)
        .storeAddress(feeWalletAddress)
        .endCell();

      // (buyer, seller, amount, royaltyBps, deadline, gasReserveMin, funded, disputed, closed, addrRef)
      const dataCell = beginCell()
        .storeAddress(buyerAddress)
        .storeAddress(sellerAddress)
        .storeCoins(amount) // amount
        .storeUint(royaltyBps, 16) // royaltyBps
        .storeUint(deadline, 64) // deadline
        .storeCoins(gasReserveMin) // gasReserveMin
        .storeUint(0, 1) // funded
        .storeUint(0, 1) // disputed
        .storeUint(0, 1) // closed
        .storeRef(addrRef)
        .endCell();

      // Log resultant cell sizes for debugging potential overflows
      try {
        const bits = dataCell.bits.length;
        const refs = dataCell.refs.length;
        console.log('[TON] Escrow dataCell built', { bits, refs });
      } catch {}

      const workchain = 0;
      const addr = contractAddress(workchain, { code: codeCell, data: dataCell });

      // Do NOT deploy from platform wallet. Client will deploy on first funding by including stateInit.
      return {
        address: addr.toString({ urlSafe: true, bounceable: true }),
        stateInit: beginCell().storeRef(codeCell).storeRef(dataCell).endCell().toBoc().toString('base64')
      };
    } catch (error) {
        console.error('[TON] Failed to create escrow contract:', error);
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