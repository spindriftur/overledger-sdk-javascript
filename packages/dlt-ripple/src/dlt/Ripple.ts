import { RippleAPI } from 'ripple-lib';
import { dropsToXrp } from 'ripple-lib/dist/npm/common';
import { deriveKeypair, deriveAddress } from 'ripple-keypairs';
import AbstractDLT from '@overledger/dlt-abstract';
import { Account, Options, TransactionOptions as BaseTransactionOptions } from '@overledger/types';
import { Payment } from 'ripple-lib/dist/npm/transaction/payment';
import { Instructions } from 'ripple-lib/dist/npm/transaction/types';

class Ripple extends AbstractDLT {
  rippleAPI: RippleAPI;
  account: Account;
  options: Object;
  /**
   * Name of the DLT
   */
  name: string = 'ripple';

  /**
   * Symbol of the DLT
   */
  symbol: string = 'XRP';

  /**
   * @inheritdoc
   */
  // @TODO: add options statement
  constructor(sdk: any, options: Options = {}) {
    super(sdk, options);

    this.options = options;

    this.rippleAPI = new RippleAPI();

    if (options.privateKey) {
      this.setAccount(options.privateKey);
    }
  }

  /**
   * Build the transaction
   *
   * @param {string} toAddress
   * @param {string} message
   * @param {TransactionOptions} options
   */
  buildTransaction(toAddress: string, message: string, options: TransactionOptions): Transaction {
    if (typeof options === 'undefined') {
      throw new Error('Transaction options must be defined.');
    }

    if (typeof options.amount === 'undefined') {
      throw new Error('options.amount must be set up');
    }

    if (typeof options.feePrice === 'undefined') {
      throw new Error('options.feePrice must be set up');
    }

    if (typeof options.sequence === 'undefined') {
      throw new Error('options.sequence must be set up');
    }

    if (typeof options.maxLedgerVersion === 'undefined') {
      throw new Error('options.maxLedgerVersion must be set up');
    }
    const maxLedgerVersion = Number(options.maxLedgerVersion);
    const amountInXRP = dropsToXrp(options.amount);
    const feeInXRP = dropsToXrp(options.feePrice);

    const address = this.account.address;
    const payment = {
      source: {
        address: this.account.address,
        amount: {
          value: amountInXRP,
          currency: 'XRP',
        },
      },
      destination: {
        address: toAddress,
        minAmount: {
          value: amountInXRP,
          currency: 'XRP',
        },
      },
      memos: [{
        data: message,
      }],
    };
    const instructions = {
      maxLedgerVersion,
      sequence: options.sequence,
      fee: feeInXRP,
    };

    return { address, payment, instructions };
  }

  /**
   * Sign the transaction
   *
   * @param {string} toAddress
   * @param {string} message
   * @param {TransactionOptions} options
   */
  _sign(toAddress: string, message: string, options: TransactionOptions): Promise<string> {
    const built = this.buildTransaction(toAddress, message, options);

    return this.rippleAPI.preparePayment(built.address, built.payment, built.instructions)
      .then(
        prepared => this.rippleAPI.sign(prepared.txJSON, this.account.privateKey).signedTransaction,
      );
  }

  /**
   * @inheritdoc
   */
  // @TODO: add return statement
  createAccount(): Account {
    const generated = this.rippleAPI.generateAddress();

    const account = {
      address: generated.address,
      privateKey: generated.secret,
    };

    return account;
  }

  /**
   * @inheritdoc
   */
  // @TODO: add return statement
  setAccount(privateKey: string): void {
    const keypair = deriveKeypair(privateKey);
    const account = {
      privateKey,
      address: keypair.publicKey,
    };
    account.address = deriveAddress(keypair.publicKey);
    this.account = account;
  }
}

export type Transaction = {
  address: string,
  payment: Payment,
  instructions?: Instructions,
};

interface TransactionOptions extends BaseTransactionOptions {
  feePrice: string;
  maxLedgerVersion: string;
  amount: string;
}

export default Ripple;
