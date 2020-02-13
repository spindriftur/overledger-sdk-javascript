import axios from 'axios';
import OverledgerSDK from '../src';
const DltNameOptions = require('@quantnetwork/overledger-types').DltNameOptions;
const TransactionTypeOptions = require('@quantnetwork/overledger-types').TransactionTypeOptions;
const TransactionBitcoinSubTypeOptions = require('@quantnetwork/overledger-dlt-bitcoin').TransactionBitcoinSubTypeOptions;


jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Dlt/Bitcoin', () => {
  let overledger;
  let account;
  let signedTransaction;

  beforeAll(() => {
    overledger = new OverledgerSDK('testmappid', 'testbpikey', {
      dlts: [{ dlt: 'bitcoin', }],
    });
  });

  test('Can create an account', () => {
    account = overledger.dlts.bitcoin.createAccount();
    overledger.dlts.bitcoin.setAccount(account.privateKey);

    expect(account.privateKey).toMatch(/[1-9A-HJ-NP-Za-km-z]{29}/);
    expect(account.address).toMatch(/[1-9A-HJ-NP-Za-km-z]{26,35}/);
  });

  //check all the required fields of the TransactionRequestObject have to be present
  test('Cannot sign a bitcoin transaction without providing the dlt parameter', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...'})).toThrow("Error parameter: dlt. Error is: All transactions must have a dlt field");
  });

  test('Cannot sign a bitcoin transaction without providing the type parameter', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin})).toThrow('Error parameter: type. Error is: All transactions must have a type field');
  });

  test('Cannot sign a bitcoin transaction by providing an incorrect type parameter', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: "..."})).toThrow('Error parameter: type. Error is: You must select a type from TransactionTypeOptions');
  });

  test('Cannot sign a bitcoin transaction without providing the subType parameter', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo})).toThrow('Error parameter: subType. Error is: All transactions must have a subType field');
  });

  test('Cannot sign a bitcoin transaction without providing the message parameter', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}})).toThrow('Error parameter: message. Error is: All transactions must have a message field. If no message is required, assign message to the empty string, i.e. message: ""');
  });

  //Check all the required fields of the TransactionUtxoRequest are present
  test('Cannot sign a bitcoin transaction without providing the txInputs parameter', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}, message: ""})).toThrow('Error parameter: txInputs. Error is: All transactions for utxo distributed ledgers must have the txInputs field');
  });
  test('Cannot sign a bitcoin transaction without providing the txOutputs parameter', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}, message: "", txInputs: []})).toThrow('Error parameter: txOutputs. Error is: All transactions for utxo distributed ledgers must have the txOutputs field');
  });
  test('Cannot sign a bitcoin transaction without a linkedTx field in the input', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}, message: "", txInputs: [{any: "..."}], txOutputs: []})).toThrow('Error parameter: txInputs.linkedTx. Error is: Each txInput for a utxo distributed ledger transaction must have a linkedTx field. If there is no linked transaction, set to the empty string, i.e.: linkedTx = ""');
  });
  test('Cannot sign a bitcoin transaction without a linkedIndex field in the input', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}, message: "", txInputs: [{any: "...", linkedTx: "..."}], txOutputs: []})).toThrow('Error parameter: txInputs.linkedIndex. Error is: Each txInput for a utxo distributed ledger transaction must have a linkedIndex field. If there is no linked transaction index, set to the empty string, i.e.: linkedIndex = ""');
  });
  test('Cannot sign a bitcoin transaction without a fromAddress field in the input', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}, message: "", txInputs: [{any: "...", linkedTx: "...", linkedIndex: "..."}], txOutputs: []})).toThrow('Error parameter: txInputs.fromAddress. Error is: Each txInput for a utxo distributed ledger transaction must have a fromAddress field. If there is no from address (e.g. for coinbase transactions), set to the empty string, i.e.: fromAddress = ""');
  });
  test('Cannot sign a bitcoin transaction without a toAddress field in the output', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}, message: "", txInputs: [{any: "...", linkedTx: "...", linkedIndex: "...", fromAddress: "..."}], txOutputs: [{any: "..."}]})).toThrow('Error parameter: txOutputs.toAddress. Error is: Each txOutput for a utxo distributed ledger transaction must have a toAddress field.');
  });
  //check the required Bitcoin fields and Bitcoin specific validation on the above fields
  test('Cannot sign an bitcoin transaction by providing an incorrect subType parameter', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: "..."}, message: "", txInputs: [], txOutputs: []})).toThrow('Error parameter: subType. Error is: You must select a subType from TransactionSubTypeOptions');
  });
  test('Cannot sign an bitcoin transaction without providing the extraFields parameter', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}, message: "", txInputs: [], txOutputs: []})).toThrow('Error parameter: extraFields. Error is: All transactions for Bitcoin must have the extraFields field set with feePrice parameters within it');
  });
  test('Cannot sign a bitcoin transaction without providing the extraFields.feePrice parameter', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}, message: "", txInputs: [], txOutputs: [], extraFields: {any: "..."}})).toThrow('Error parameter: extraFields.feePrice. Error is: All transactions for Bitcoin must have the extraFields.feePrice field set and it must be convertable to a number');
  });
  test('Cannot sign a bitcoin transaction without an amount field in the input', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}, message: "", txInputs: [{any: "...", linkedTx: "...", linkedIndex: "...", fromAddress: "..."}], txOutputs: [], extraFields: {any: "...", feePrice: "10"}})).toThrow('Error parameter: thisBitcoinTx.txInputs.amount. Error is: All transactions inputs for Bitcoin must have an amount field');
  });
  test('Cannot sign a bitcoin transaction without an amount field in the output', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}, message: "", txInputs: [{any: "...", linkedTx: "...", linkedIndex: "...", fromAddress: "...", amount: 80}], txOutputs: [{toAddress: "..." }], extraFields: {any: "...", feePrice: "10"}})).toThrow('Error parameter: thisBitcoinTx.txOutputs.amount. Error is: All transactions outputs for Bitcoin must have an amount field');
  });
  test('Cannot sign a bitcoin transaction if the total input amount does not equal the total output amount + feePrice', () => {
    expect(() => overledger.dlts.bitcoin.sign({any: '...', dlt: DltNameOptions.bitcoin, type: TransactionTypeOptions.utxo, subType: {name: TransactionBitcoinSubTypeOptions.valueTransfer}, message: "", txInputs: [{any: "...", linkedTx: "...", linkedIndex: "...", fromAddress: "...", amount: 100}], txOutputs: [{toAddress: "...", amount: 80}], extraFields: {any: "...", feePrice: "10"}})).toThrow('Error parameter: amount. Error is: All transactions for Bitcoin must satisfy the following logic: TotalInputAmounts - TotalOutputAmounts - feePrice = 0');
  });
  /*test('Can sign a ripple transaction', async () => {
    signedTransaction = await overledger.dlts.ripple.sign({any: '...', dlt: DltNameOptions.xrp, type: TransactionTypeOptions.accounts, subType: {name: TransactionXRPSubTypeOptions.valueTransfer}, message: "", fromAddress: "rndaCtYjxKq3vBTA3ER1SAPSgvQRMXQZnz", toAddress: "rLEBHTbZBeSaY4ghcjLQMYvFEgKFyoRXbp", sequence: 1, amount: 1, extraFields: {feePrice: "1", maxLedgerVersion: "12345"}});

    expect(signedTransaction.length).toBeGreaterThan(200);
    expect(signedTransaction.startsWith('120')).toBe(true);
  });

  test('Can send a ripple signedTransaction', async () => {
    mockedAxios.post.mockResolvedValue({ status: 'broadcasted', dlt: 'ripple', transactionHash: 'E8F7ED33E0FD8A06C33A00165508A556A958F2DC53AF4C5FC40FD93FA1A50693' } as any);
    const signedTransactionRequest = {
      dlt: 'ripple',
      fromAddress: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      signedTransaction: {
        signatures: [],
        transactions: [signedTransaction],
      },
    }
    
    await overledger.dlts.ripple.send(signedTransactionRequest);

    expect(mockedAxios.post).toBeCalledWith('/transactions', {
      mappId: 'testmappid',
      dltData:
        [{
          dlt: 'ripple',
          fromAddress: expect.any(String),
          signedTransaction: expect.any(Object),
        }],
    });
  });*/
});
