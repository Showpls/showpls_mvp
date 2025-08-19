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
    // Initialize TON client based on network
    const isTestnet = (process.env.TON_NETWORK || process.env.NODE_ENV) === 'testnet';
    const endpoint = isTestnet
      ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
      : 'https://toncenter.com/api/v2/jsonRPC';
    this.client = new TonClient({
      endpoint,
      apiKey: process.env.TON_API_KEY
    });
    
    this.initializePlatformWallet();
  }

  async isContractActive(addressStr: string): Promise<boolean> {
    try {
      const address = Address.parse(addressStr);
      try { console.log('[TON] isContractActive.check', { address: address.toString({ urlSafe: true, bounceable: true }) }); } catch {}
      const info = await this.client.getContractState(address);
      const active = info?.state === 'active';
      try { console.log('[TON] isContractActive.result', { state: info?.state, active }); } catch {}
      return active;
    } catch (error) {
      console.error('Failed to get contract state:', error);
      return false;
    }
  }

  // Build payload body for OP_FUND (10)
  buildFundBody(): string {
    const body = beginCell().storeUint(10, 32).endCell();
    const b64 = body.toBoc().toString('base64');
    try { console.log('[TON] buildFundBody', { prefix: b64.slice(0, 24), bytes: Buffer.from(b64, 'base64').length }); } catch {}
    return b64;
  }

  // Build payload body for OP_APPROVE (20)
  buildApproveBody(): string {
    const body = beginCell().storeUint(20, 32).endCell();
    const b64 = body.toBoc().toString('base64');
    try { console.log('[TON] buildApproveBody', { prefix: b64.slice(0, 24), bytes: Buffer.from(b64, 'base64').length }); } catch {}
    return b64;
  }

  // Prepare funding transaction details for client (TonConnect)
  prepareFundingTx(params: {
    escrowAddress: string;
    amountNano: bigint; // order amount
    includeStateInit?: string; // base64
    gasReserveNano?: bigint; // default from env TON_ESCROW_DEPLOY_RESERVE or 0.2 TON
  }): { address: string; amountNano: string; bodyBase64?: string; stateInit?: string } {
    const defaultReserveStr = process.env.TON_ESCROW_FUND_RESERVE ?? '0.1';
    const gas = params.gasReserveNano ?? toNano(defaultReserveStr);
    const total = params.amountNano + gas;
    const includeInit = params.includeStateInit;
    try {
      console.log('[TON] prepareFundingTx', {
        escrowAddress: params.escrowAddress,
        amountNano: params.amountNano.toString(),
        gasReserveDefaultStr: defaultReserveStr,
        gasNano: gas.toString(),
        totalNano: total.toString(),
        includeStateInit: !!includeInit,
        stateInitBytes: includeInit ? Buffer.from(includeInit, 'base64').length : 0,
      });
    } catch {}
    return {
      address: params.escrowAddress,
      amountNano: total.toString(),
      // Always include OP_FUND body so contract sets funded=1 on first transfer
      bodyBase64: this.buildFundBody(),
      stateInit: includeInit,
    };
  }

  // Prepare approval transaction details for client (TonConnect)
  prepareApproveTx(params: {
    escrowAddress: string;
    gasFeeNano?: bigint; // forward small fee to cover gas
  }): { address: string; amountNano: string; bodyBase64: string } {
    const fee = params.gasFeeNano ?? toNano('0.05');
    return {
      address: params.escrowAddress,
      amountNano: fee.toString(),
      bodyBase64: this.buildApproveBody(),
    };
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
      const gasReserveMin = toNano('0.1'); // 0.1 TON (fits into 32 bits)

      // Data layout must match FunC:
      // buyer, seller, guarantor, feeWallet, amount(uint64), royaltyBps(uint16), deadline(uint64), gasReserveMin(uint32), funded(1), disputed(1), closed(1)
      const dataCell = beginCell()
        .storeAddress(buyerAddress)
        .storeAddress(sellerAddress)
        .storeAddress(guarantorAddress)
        .storeAddress(feeWalletAddress)
        .storeUint(amount, 64)
        .storeUint(royaltyBps, 16)
        .storeUint(deadline, 64)
        .storeUint(gasReserveMin, 32)
        .storeUint(0, 1)
        .storeUint(0, 1)
        .storeUint(0, 1)
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
        // Use non-bounceable + testOnly for testnet deploy+fund
        address: addr.toString({ urlSafe: true, bounceable: false, testOnly: (process.env.TON_NETWORK || process.env.NODE_ENV) === 'testnet' }),
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

  async getEscrowStatus(contractAddress: string, minValueNano?: bigint): Promise<string> {
    try {
      // Check inbound transactions to escrow address via toncenter
      const address = Address.parse(contractAddress).toString({ urlSafe: true, bounceable: true });
      const apiKey = process.env.TON_API_KEY;
      const isTestnet = (process.env.TON_NETWORK || process.env.NODE_ENV) === 'testnet';
      const base = isTestnet ? 'https://testnet.toncenter.com' : 'https://toncenter.com';
      const url = `${base}/api/v2/getTransactions?address=${address}&limit=50${apiKey ? `&api_key=${apiKey}` : ''}`;
      try {
        console.log('[ESCROW] verify: querying transactions', { address, minValueNano: minValueNano?.toString(), url: `${base}/api/v2/getTransactions?...` });
      } catch {}
      const res = await fetch(url);
      try { console.log('[ESCROW] verify: tx fetch status', { status: res.status, ok: res.ok }); } catch {}
      const json = await res.json();
      try { console.log('[ESCROW] verify: tx json meta', { ok: json?.ok, count: Array.isArray(json?.result) ? json.result.length : undefined }); } catch {}
      if (json?.ok && Array.isArray(json.result)) {
        // Diagnostics: log inbound values and payload prefixes
        try {
          const inboundSumm = json.result
            .map((tx: any) => {
              const v = tx?.in_msg?.value;
              const body = tx?.in_msg?.msg_data?.body; // base64 if present
              const prefix = body ? String(body).slice(0, 24) : undefined;
              return v ? { v, prefix, utime: tx?.utime } : null;
            })
            .filter(Boolean)
            .slice(0, 10);
          console.log('[ESCROW] verify: inbound candidates (top10)', inboundSumm);
        } catch {}

        const inbound = json.result.find((tx: any) => {
          const v = tx?.in_msg?.value;
          if (!v) return false;
          try {
            const val = BigInt(v);
            if (minValueNano && val < minValueNano) return false;
            return val > BigInt(0);
          } catch {
            return false;
          }
        });
        if (inbound) {
          try {
            console.log('[ESCROW] verify: inbound match', {
              value: inbound?.in_msg?.value,
              utime: inbound?.utime,
              hasBody: !!inbound?.in_msg?.msg_data?.body,
              bodyPrefix: inbound?.in_msg?.msg_data?.body ? String(inbound.in_msg.msg_data.body).slice(0, 24) : undefined,
            });
          } catch {}
          return 'funded';
        }

        // Fallback: check live balance if no inbound tx matched (indexer delay cases)
        try {
          const infoUrl = `${base}/api/v2/getAddressInformation?address=${address}${apiKey ? `&api_key=${apiKey}` : ''}`;
          const infoRes = await fetch(infoUrl);
          try { console.log('[ESCROW] verify: balance fetch status', { status: infoRes.status, ok: infoRes.ok }); } catch {}
          const info = await infoRes.json();
          const balStr = info?.ok ? info?.result?.balance : undefined;
          try { console.log('[ESCROW] verify: balance json meta', { ok: info?.ok, hasBalance: !!balStr }); } catch {}
          if (balStr) {
            const bal = BigInt(balStr);
            if (!minValueNano) {
              return bal > BigInt(0) ? 'funded' : 'pending';
            }
            if (bal >= minValueNano) {
              try { console.log('[ESCROW] verify: funded by balance fallback', { address, bal: bal.toString(), min: minValueNano.toString() }); } catch {}
              return 'funded';
            }
            try { console.log('[ESCROW] verify: pending by balance insufficient', { address, bal: bal.toString(), min: minValueNano.toString() }); } catch {}
          }
        } catch (e) {
          try { console.warn('[ESCROW] verify: balance fallback failed'); } catch {}
        }

        return 'pending';
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

  async checkSufficientBalance(
    address: string,
    requiredAmount: bigint,
    options?: { includeDeployReserve?: boolean; includeFundReserve?: boolean }
  ): Promise<{ sufficient: boolean; balance: bigint; required: bigint }> {
    try {
      const balance = await this.getWalletBalance(address);
      const deployReserveStr = process.env.TON_ESCROW_DEPLOY_RESERVE ?? '0.05';
      const fundReserveStr = process.env.TON_ESCROW_FUND_RESERVE ?? '0.1';
      const includeDeploy = options?.includeDeployReserve ?? true;
      const includeFund = options?.includeFundReserve ?? true;
      const deployReserve = includeDeploy ? toNano(deployReserveStr) : BigInt(0);
      const fundReserve = includeFund ? toNano(fundReserveStr) : BigInt(0);
      const totalRequired = requiredAmount + deployReserve + fundReserve;
      
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