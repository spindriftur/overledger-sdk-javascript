import {TransactionAccountsResponse} from "@quantnetwork/overledger-types";

/**
* A generic object used to describe an Overledger transaction response for the XRP Ledger. Note that this object inherits many parameters from TransactionAccountsResponse.
* @typedef {Object} TransactionEthereumResponse
* @property {string} feePrice - the fee paid for this transaction to enter the XRP ledger. It is denoted in drops where the current minimum allowed is 12.
* @property {string} maxLedgerVersion - The maximum ledger version the transaction can be included in
*/

/**
 * @memberof module:overledger-dlt-xrp
 */
interface TransactionXRPResponse extends TransactionAccountsResponse {
        extraFields: {
            feePrice: string,
            maxLedgerVersion: string
        }
  };
  
  export default TransactionXRPResponse;
  