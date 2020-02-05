import Accounts from 'web3-eth-accounts';
import Web3 from 'web3';
import { MAINNET } from '@quantnetwork/overledger-provider';
import AbstractDLT from '@quantnetwork/overledger-dlt-abstract';
import { Options, Account, TransactionRequest } from '@quantnetwork/overledger-types';
import {TransactionSubTypeOptions, SCFunctionTypeOptions, TransactionValidationCheck} from '@quantnetwork/overledger-types';
import TransactionEthereumRequest from './DLTSpecificTypes/TransactionEthereumRequest';
import SCEthereumParam from './DLTSpecificTypes/SCEthereumParam';
import SmartContractEthereum from './DLTSpecificTypes/SmartContractEthereum';
import computeParamType from './DLTSpecificTypes/ParamType';

/**
 * @memberof module:overledger-dlt-ethereum
*/
class Ethereum extends AbstractDLT {
  chainId: number;
  account: Accounts;
  options: Object;
  web3: Web3;

  /**
   * Name of the DLT
   */
  name: string = 'ethereum';

  /**
   * Symbol of the DLT
   */
  symbol: string = 'ETH';

  /**
   * @param {any} sdk - the sdk instance
   * @param {Object} options - any additional options to instantiate this dlt
   */
  // @TODO: add options statement
  constructor(sdk: any, options: Options = {}) {
    super(sdk, options);

    this.web3 = new Web3();
    this.options = options;

    if (options.privateKey) {
      this.setAccount(options.privateKey);
    }

    if (sdk.network === MAINNET) {
      this.chainId = 1;
    } else {
      this.chainId = 3;
    }
  }

  /**
   * Create an account for a specific DLT
   *
   * @return {Account} the new Ethereum account
   */
  createAccount(): Account {
    return this.web3.eth.accounts.create();
  }

  /**
   * Set an account for signing transactions for a specific DLT
   *
   * @param {string} privateKey The privateKey
   */
  setAccount(privateKey: string): void {
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
  }

  /**
   * Takes the Overledger definition of a transaction and converts it into a specific Ethereum transaction
   * @param {TransactionEthereumRequest} thisTransaction - details on the information to include in this transaction for the Ethereum distributed ledger
   * @return {Transaction} the Ethereum transaction
   */
  buildTransaction(thisTransaction: TransactionEthereumRequest): Transaction {
    
    super.transactionValidation(thisTransaction);

    let transactionData = "";
    let invocationType;
     if (thisTransaction.subType === TransactionSubTypeOptions.valueTransfer) {
        transactionData = this.web3.utils.asciiToHex(thisTransaction.message);
    } else if (thisTransaction.subType === TransactionSubTypeOptions.smartContractDeploy) {
      if (!thisTransaction.toAddress) {
        invocationType = thisTransaction.smartContract.functionCall[0].functionType;
        if (invocationType === SCFunctionTypeOptions.constructorWithNoParameters) {
          transactionData = thisTransaction.smartContract.code;
        } else if (invocationType === SCFunctionTypeOptions.constructorWithParameters) {
          const paramsList = <SCEthereumParam[]>  thisTransaction.smartContract.functionCall[0].inputParams;
          if (!paramsList || paramsList.length <= 0) {
            throw new Error(`When deploying a smart contract with parameters, then thisTransaction.smartContract.functionCall.inputParams must be defined with a non-null length`);
          }
          transactionData = this.computeTransactionDataForConstructorWithParams(thisTransaction.smartContract.code, paramsList);
        } else {
          throw new Error(`When deploying a smart contract, you must set the thisTransaction.smartContract.functionCall.functionType parameter to be one of SCFunctionTypeOptions`);
        }
      } else {
        throw new Error('When deploying a smart contract, the toAddress must be set to the empty string, i.e. Transaction.toAddress = "" ');
      }
    } else if (thisTransaction.subType === TransactionSubTypeOptions.smartContractInvocation) {
      invocationType = thisTransaction.smartContract.functionCall[0].functionType;
      if (thisTransaction.toAddress) {
        if ((invocationType === SCFunctionTypeOptions.functionCallWithParameters)||(invocationType === SCFunctionTypeOptions.functionCallWithNoParameters)) {
          const paramsList = <SCEthereumParam[]> thisTransaction.smartContract.functionCall[0].inputParams;
          if (!paramsList) {
            throw new Error(`If invoking a smart contract then the thisTransaction.smartContract.functionCall.inputParams parameter must be defined. If the called function takes no parameters then set it to the empty array, i.e. functionParameters = []`);
          }
          const functionName = thisTransaction.smartContract.functionCall[0].functionName;
          if (!functionName) {
            throw new Error(`When invoking a smart contract function, the name of the called function must be given by setting thisTransaction.smartContract.functionCall.functionName`);
          }
          transactionData = this.computeTransactionDataForFunctionCall(functionName, paramsList);
        }
        else {
          throw new Error(`When invoking a smart contract function thisTransaction.smartContract.functionCall.functionType must be set to SCFunctionTypeOptions.functionCall`);
        }
      } else {
        throw new Error('When invoking a smart contract, the toAddress must be set to a non empty string, equal to the ethereum address of the smart contract, i.e. Transaction.toAddress = "0x..." ');
      }

    }

    const transaction = {
      nonce: thisTransaction.sequence,
      chainId: this.chainId,
      to: thisTransaction.toAddress,
      gas: thisTransaction.extraFields.compLimit,
      gasPrice: thisTransaction.extraFields.compUnitPrice,
      value: thisTransaction.amount.toString(),
      data: transactionData,
    };
    return transaction;
  }

  _transactionValidation(thisTransaction: TransactionRequest): TransactionValidationCheck {
    
    //now input validation on an Ethereum transaction
    let thisEthereumTx = <TransactionEthereumRequest> thisTransaction;
    let ethereumSC = <SmartContractEthereum>thisEthereumTx.smartContract; //recasting for extra fields

    if ((!thisEthereumTx.extraFields)||(thisEthereumTx.extraFields == null)){
      return {
        success: false,
        failingField: "extraFields",
        error: 'All transactions for XRP must have the extraFields field set with feePrice and maxLedgerVersion parameters within it'
      } 
    } else if ((thisEthereumTx.extraFields.compLimit == "")||(thisEthereumTx.extraFields.compLimit == null)||(thisEthereumTx.extraFields.compLimit === 'undefined')){
      return {
        success: false,
        failingField: "extraFields.compLimit",
        error: 'All transactions for Ethereum must have the extraFields.compLimit field set'
      }     
    } else if ((thisEthereumTx.extraFields.compUnitPrice == "")||(thisEthereumTx.extraFields.compUnitPrice == null)||(thisEthereumTx.extraFields.compLimit === 'undefined')){
      return {
        success: false,
        failingField: "extraFields.compUnitPrice",
        error: 'All transactions for Ethereum must have the extraFields.compUnitPrice field set'
      }       
    } else if ((thisTransaction.subType === TransactionSubTypeOptions.smartContractDeploy)&&(!thisEthereumTx.smartContract)){
      return {
        success: false,
        failingField: "smartContract",
        error: 'To deploy a smart contract on Ethereum, you need to define a smartContract object'
      }   
    } else if ((thisTransaction.subType === TransactionSubTypeOptions.smartContractDeploy)&&(!ethereumSC.code)){
      return {
        success: false,
        failingField: "smartContract.code",
        error: 'To deploy a smart contract on Ethereum, you need to provide the smartContract.code field'
      }   
    } else if ((thisTransaction.subType === TransactionSubTypeOptions.smartContractDeploy)&&(!ethereumSC.functionCall)){
      return {
        success: false,
        failingField: "smartContract.functionCall",
        error: 'To deploy a smart contract on Ethereum, you need to provide the smartContract.functionCall field'
      }   
    } else if ((thisTransaction.subType === TransactionSubTypeOptions.smartContractDeploy)&&(!ethereumSC.functionCall[0].functionType)){
      return {
        success: false,
        failingField: "smartContract.functionCall[0].functionType",
        error: 'To deploy a smart contract on Ethereum, you need to provide the smartContract.functionCall[0].functionType field and set it equal to constructorWithNoParameters or constructorWithParameters'
      }   
    } else if ((thisTransaction.subType === TransactionSubTypeOptions.smartContractDeploy)&&(ethereumSC.functionCall[0].functionType == SCFunctionTypeOptions.constructorWithParameters)&&(!ethereumSC.functionCall[0].inputParams)){
      return {
        success: false,
        failingField: "smartContract.functionCall[0].inputParams",
        error: 'To deploy a smart contract on Ethereum that has parameters in its constructor, you need to provide them in the smartContract.functionCall[0].inputParams field'
      }   
    } else if (!thisEthereumTx.toAddress && thisTransaction.subType === TransactionSubTypeOptions.smartContractInvocation) {
      return {
        success: false,
        failingField: "toAddress",
        error: 'If Transaction.subType === TransactionSubTypeOptions.smartContractInvocation then a transaction.toAddress needs to be set indicating the address of the smart contract to invoke.'
      } 
    }

    if (thisEthereumTx.amount > 0
      && (thisEthereumTx.subType === TransactionSubTypeOptions.smartContractDeploy || thisEthereumTx.subType === TransactionSubTypeOptions.smartContractInvocation)
      && ethereumSC.extraFields.payable === false) {
      return {
        success: false,
        failingField: "extraFields.payable",
        error: 'If deploying or invoking a smart contract and ethereumSC.extraFields.payable === "false", then transaction.amount must be set to 0'
      } 
    }

    //for each parameter in the smart contract inputs and outputs
    //...
    return {success: true};
  }

  /**
   * Convert Overledger object description of a smart contract constructor and parameters into Ethereum versions
   * @param {string} smartContractCode - the bytecode of the smart contract (without the byte code information on the constructor variables) 
   * @param {SCEthereumParam[]} paramsList - the list of parameters that this constructor takes as input
   * 
   * @return {string} the bytecode of the smart contract and the parameters
   */
  private computeTransactionDataForConstructorWithParams(smartContractCode: string, paramsList: SCEthereumParam[]): string {
    const typesAndValues = paramsList.reduce((paramsValues, p) => {
      const paramType = computeParamType(p);
      paramsValues[0].push(paramType);
      paramsValues[1].push(p.value);
      return paramsValues;
    }, [[], []]);
    const encodedParams = this.web3.eth.abi.encodeParameters(typesAndValues[0], typesAndValues[1]).slice(2);
    return smartContractCode + encodedParams;
  }

  /**
   * Convert Overledger object description of a smart contract function and parameters into Ethereum versions
   * @param {string} functionName - the name of the smart contract function to call
   * @param {SCEthereumParam[]} paramsList - the list of parameters that this function takes as input
   * 
   * @return {string} the bytecode of this function call
   */
  private computeTransactionDataForFunctionCall(functionName: string, paramsList: SCEthereumParam[]): string {
    const inputsAndValues = paramsList.reduce((paramsValues, p) => {
      const paramType = computeParamType(p);
      paramsValues[0].push({ type: paramType.toString(), name: p.name });
      paramsValues[1].push(p.value);
      return paramsValues;
    }, [[], []]);

    const jsonFunctionCall: IJsonFunctionCall = {
      name: functionName,
      type: 'function',
      inputs: <[{ type: string, name: string }]>inputsAndValues[0]
    }
    const encodedInput = this.web3.eth.abi.encodeFunctionCall(jsonFunctionCall, inputsAndValues[1]);
    return encodedInput;
  }

  /**
   * Takes in an overledger definition of a transaction for ethereum, converts it into a form that the Ethereum distributed ledger will understand, and then signs the transaction
   * @param {TransactionRequest} thisTransaction - an instantiated overledger definition of an ethereum transaction
   */
  _sign(thisTransaction: TransactionRequest): Promise<string> {

    const transaction = this.buildTransaction(<TransactionEthereumRequest>thisTransaction);

    return new Promise((resolve, reject) => {
      this.account.signTransaction(transaction, (err, data) => {
        if (err) {
          return reject(err);
        }

        return resolve(data.rawTransaction);
      });
    });
  }

  /**
   * Allows a user to build a smart contract query for the Ethereum distributed ledger
   * @param {string} dltAddress - the user's Ethereum address
   * @param {SmartContractEthereum} contractQueryDetails - the definition of the smart contract function the user wants to interact with, including information on what parameters to use in the function call.
   *
   * @return {Object} success indicates if this query building was correct, if yes then it will be in the response field of the object
   */
  buildSmartContractQuery(dltAddress: string, contractQueryDetails: SmartContractEthereum): Object {
    try {
      let theseEthereumInputParams = <SCEthereumParam[]>contractQueryDetails.functionCall[0].inputParams;
      let theseEthereumOutputParams = <SCEthereumParam[]>contractQueryDetails.functionCall[0].outputParams;
      const data = {
        fromAddress: dltAddress,
        contractAddress: contractQueryDetails.id,
        funcName: contractQueryDetails.functionCall[0].functionName,
        inputValues: this.computeSCQueryInputValuesList(theseEthereumInputParams),
        outputTypes: this.computeSCQueryOutputTypesList(theseEthereumOutputParams)
      }
      return {success: true, response: data};
    } catch (e) {
      return {success: false, response: e.response};
    }
  }
  
  /**
   * computes the input parameters into the smart contract function query
   * @param {SCEthereumParam[]} inputFunctionParams - the list of input parameters
   */
  private computeSCQueryInputValuesList(inputFunctionParams: SCEthereumParam[]) {
    const inputValues = inputFunctionParams.reduce((inputParams, p) => {
      const paramType = computeParamType(p);
      inputParams.push(<QueryInput>{type: paramType, value: p.value});
      return inputParams;
    }, []);
    return inputValues;
  }
  
  /**
   * computes the output parameters into the smart contract function query
   * @param {SCEthereumParam[]} outputFunctionTypes 
   */
  computeSCQueryOutputTypesList(outputFunctionTypes: SCEthereumParam[]) {
    const outputTypes = outputFunctionTypes.reduce((outputTypes, p) => {
      const paramType = computeParamType(p);
      outputTypes.push(<QueryOutput>{type: paramType});
      return outputTypes;
    }, []);
    return outputTypes;
  }

}

interface QueryInput {
  type: string;
  value: string;
}

interface QueryOutput {
  type: string;
}

export type Transaction = {
  nonce: number,
  chainId: number,
  to: string,
  gas: string,
  gasPrice: string,
  value: string,
  data: string,
};

interface IJsonFunctionCall {
  name: string;
  type?: string;
  inputs: [{ type: string, name: string }];
}


export default Ethereum;