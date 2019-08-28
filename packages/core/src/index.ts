import { AxiosInstance, AxiosPromise } from 'axios';
import Search from '@overledger/search';
import Provider, { TESTNET } from '@overledger/provider';
import AbstractDLT from '@overledger/dlt-abstract';
import { SignedTransactionRequest, SDKOptions, DLTOptions, UnsignedData, SequenceDataRequest, APICallWrapper, DLTAndAddressArray } from '@overledger/types';
import networkOptions from '@overledger/types/src/networkOptions';
import SequenceDataResponse from '@overledger/types/src/SequenceDataResponse';

class OverledgerSDK {
  /**
   * The object storing the DLTs loaded by the Overledger sdk
   */
  dlts: { [key: string]: AbstractDLT } = {};

  mappId: string;
  bpiKey: string;
  network: networkOptions;
  provider: any; // TODO: define the type
  request: AxiosInstance;
  search: Search;

  /**
   * @param {string} mappId
   * @param {string} bpiKey
   * @param {Object} options
   */
  constructor(mappId: string, bpiKey: string, options: SDKOptions) {
    this.mappId = mappId;
    this.bpiKey = bpiKey;
    this.network = options.provider && options.provider.network || TESTNET;

    this.validateOptions(options);

    options.dlts.forEach((dltConfig: DLTOptions) => {
      const dlt = this.loadDlt(dltConfig);
      this.dlts[dlt.name] = dlt;
    });

    this.provider = new Provider(mappId, bpiKey, options.provider);
    this.request = this.provider.createRequest();
    this.search = new Search(this);
  }

  /**
   * Load the dlt to the Overledger SDK
   *
   * @param {Object} config
   *
   * @return {Provider}
   */
  private loadDlt(config: DLTOptions): AbstractDLT {
    // Need to improve this loading
    const dltName = `dlt-${config.dlt}`;
    try {
      const provider = require(`@overledger/${dltName}`).default;

      return new provider(this, config);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        throw `Could not find the package for this DLT. Please install @overledger/${dltName} manually`;
      }
    }
  }

  /**
   * Validate the provided options
   *
   * @param {SDKOptions} options
   */
  private validateOptions(options: SDKOptions): void {
    if (!options.dlts) {
      throw new Error('The dlts are missing');
    }
  }

  /**
   * Sign the provided transaction
   *
   * @param {UnsignedData} unsignedData Data object encompassing a single transaction
   */
  public async sign(unsignedData: UnsignedData): Promise<string> {
    const signedTransaction = await this.dlts[unsignedData.dlt].sign(unsignedData.toAddress, unsignedData.message, unsignedData.options)

    return signedTransaction;
  }

  /**
   * Wrap the DLTData with the api schema
   *
   * @param {Array} dltData
   */
  private buildWrapperApiCall(dltData: SignedTransactionRequest[] | SequenceDataRequest[]): APICallWrapper {
    return {
      mappId: this.mappId,
      dltData,
    };
  }

  /**
   * Send signed transactions to the provided DLTs
   *
   * @param {SignedTransactionRequest[]} signedTransactions Object of the DLTs where you want to send a transaction
   */
  public send(signedTransactions: SignedTransactionRequest[]): AxiosPromise<Object> {
    const apiCall = signedTransactions.map(
      stx => this.dlts[stx.dlt].buildSignedTransactionsApiCall(stx),
    );

    return this.request.post('/transactions', this.buildWrapperApiCall(apiCall));
  }

  /**
   * Get the sequence number from the provided address
   *
   * @param {SequenceDataRequest[]} sequenceData[]
   */
  public getSequences(sequenceData: SequenceDataRequest[]): AxiosPromise<SequenceDataResponse> {
    return this.request.post('/sequence', this.buildWrapperApiCall(sequenceData));
  }

  /**
   * Read by mapp id
   */
  public readTransactionsByMappId(): AxiosPromise<Object> {
    return this.request.get(`/transactions/mappid/${this.mappId}`);
  }

  /**
   * read by overledger transaction id
   *
   * @param {string} ovlTransactionId
   */
  public readByTransactionId(ovlTransactionId: string): AxiosPromise<Object> {
    return this.request.get(`/transactions/id/${ovlTransactionId}`);
  }

  /**
   * Set the mapp id
   *
   * @param {string} mappId
   */
  public setMappId(mappId: string): void {
    this.mappId = mappId;
  }

  /**
   * get the mapp id
   */
  public getMappId(): string {
    return this.mappId;
  }

  /**
   * set the bpi key
   *
   * @param {string} bpiKey
   */
  public setBpiKey(bpiKey: string): void {
    this.bpiKey = bpiKey;
  }

  /**
   * get the bpi key
   */
  public getBpiKey(): string {
    return this.bpiKey;
  }

  public getBalances(array: DLTAndAddressArray): AxiosPromise<Object> {
    return this.request.post('/balances', array);
  }
}

export default OverledgerSDK;
