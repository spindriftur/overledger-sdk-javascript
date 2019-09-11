import bitcoin from 'bitcoinjs-lib';
import AbstractDLT from '@overledger/dlt-abstract';
import { MAINNET } from '@overledger/provider';
import { Options, Account, TransactionOptions as BaseTransactionOptions } from '@overledger/types';

class Bitcoin extends AbstractDLT {
  NON_DUST_AMOUNT: number = 546;
  addressType: string;
  privateKey: string;
  account: Account;
  options: Object;

  /**
   * Name of the DLT
   */
  name: string = 'bitcoin';

  /**
   * Symbol of the DLT
   */
  symbol: string = 'XBT';

  /**
   * @inheritdoc
   */
  constructor(sdk: any, options: Options) {
    super(sdk, options);

    if (sdk.network === MAINNET) {
      this.addressType = bitcoin.networks.bitcoin;
    } else {
      this.addressType = bitcoin.networks.testnet;
    }

    if (options.privateKey) {
      this.setAccount(options.privateKey);
    }
  }

  /**
   * @inheritdoc
   */
  // @TODO: add return statement
  buildTransaction(toAddress: string, message: string, options: TransactionOptions): any {
    if (typeof options === 'undefined') {
      throw new Error('Transaction options must be defined.');
    }

    if (typeof options.sequence === 'undefined') {
      throw new Error('options.sequence must be set up');
    }

    if (typeof options.previousTransactionHash === 'undefined') {
      throw new Error('options.previousTransactionHash must be set up');
    }

    if (typeof options.value === 'undefined') {
      throw new Error('options.value must be set up');
    }

    if (typeof options.feePrice === 'undefined') {
      throw new Error('options.feePrice must be set up');
    }

    const value = Number(options.value);
    const amount = Number(options.amount);
    const feePrice = Number(options.feePrice);

    const tx = new bitcoin.TransactionBuilder(this.addressType);
    const data = Buffer.from(message, 'utf8'); // Message is inserted

    tx.addInput(options.previousTransactionHash, options.sequence);
    tx.addOutput(toAddress, amount);
    const ret = bitcoin.script.compile(
      [
        bitcoin.opcodes.OP_RETURN,
        data,
      ]);
    tx.addOutput(ret, 0);
    tx.addOutput(this.account.address, value - amount - this.NON_DUST_AMOUNT - feePrice);

    return tx;
  }

  /**
   * @inheritdoc
   */
  _sign(toAddress: string, message: string, options: TransactionOptions): Promise<string> {
    const transaction = this.buildTransaction(toAddress, message, options);
    transaction.sign(0, this.account.privateKey);

    return Promise.resolve(transaction.build().toHex());
  }

  /**
   * @inheritdoc
   */
  createAccount(): Account {
    const keyPair = bitcoin.ECPair.makeRandom({ network: this.addressType });

    const privateKey = keyPair.toWIF();
    const { address } = bitcoin.payments
      .p2pkh({ pubkey: keyPair.publicKey, network: this.addressType });

    return {
      privateKey,
      address,
    };
  }

  /**
   * @inheritdoc
   */
  setAccount(privateKey: string): void {
    const keyPair = bitcoin.ECPair.fromWIF(privateKey, this.addressType);

    this.account = {
      privateKey: keyPair,
      address: bitcoin.payments
        .p2pkh({ pubkey: keyPair.publicKey, network: this.addressType }).address,
    };
  }
}

interface TransactionOptions extends BaseTransactionOptions {
  previousTransactionHash: string;
  value: string;
  amount: string;
  feePrice: string;
}

export default Bitcoin;
