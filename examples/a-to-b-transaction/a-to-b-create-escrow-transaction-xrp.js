// Replace the dependency by @quantnetwork/overledger-bundle if you're in your own project
const OverledgerSDK = require('../../packages/overledger-bundle/dist').default;
const TransactionTypes = require('../../packages/overledger-dlt-ripple/dist/Ripple').TransactionTypes;
const DltNames = require('../../packages/overledger-dlt-abstract/dist/AbstractDLT').DltNames;

//  ---------------------------------------------------------
//  -------------- BEGIN VARIABLES TO UPDATE ----------------
//  ---------------------------------------------------------

//The following are found from your Overledger Account:
const mappId = '<ENTER YOUR MAPPID>';
const bpiKey = '<ENTER YOUR BPIKEY>';

// This example, shows how to create an escrow on XRP between two parties A and B.
// Paste in the two parties XRP addresses (also known as account) and party A's private key.
// To generate XRP test accounts, you can go to the official Ripple Testnet Faucet to get a prefunded one.

//Party A will be the creator of the escrow. Party A's details are as follows:
const partyARipplePrivateKey = '<ENTER YOUR XRP PARTY A PRIVATE KEY>';
const partyARippleAddress = '<ENTER YOUR XRP PARTY A ADDRESS>';

// Party B's details are as follows:
const partyBRippleAddress = '<ENTER YOUR XRP PARTY B ADDRESS>';

//  ---------------------------------------------------------
//  -------------- END VARIABLES TO UPDATE ------------------
//  ---------------------------------------------------------

; (async () => {
  try {
    //connect to overledger and choose the XRP distributed ledger:
    const overledger = new OverledgerSDK(mappId, bpiKey, {
      dlts: [{ dlt: DltNames.xrp }],
      provider: { network: 'testnet' },
    });

    //You can add a message that will be encorporated into the transaction (this is additional to the escrow functionality):
    const transactionMessage = 'Overledger JavaScript SDK Escrow Creation Test';

    // SET party A's corresponding private key that will be used for signing messages from his account;
    overledger.dlts.ripple.setAccount(partyARipplePrivateKey);

    // Get party A's account sequences. XRP requires transactions to be sent from an account in seqeunce order, overledger finds the next correct sequence number
    const rippleSequenceRequest = await overledger.dlts.ripple.getSequence(partyARippleAddress);
    const rippleAccountSequence = rippleSequenceRequest.data.dltData[0].sequence;

    //create time variables for use in the escrow
    let escrowExecutionAfter = new Date(Date.now() + (1*60000)); //set escrow execution 1 mins into the future
    let escrowCancelationAfter = new Date(Date.now() + (2*60000)); //set escrow cancelation 2 mins into the future
    console.log('escrowExecutionAfter: ' + escrowExecutionAfter.toISOString());
    console.log('escrowCancelationAfter: ' + escrowCancelationAfter.toISOString());

    // Sign the transactions.
    const signedTransactions = await overledger.sign([
    {
      // In order to prepare an XRP transaction offline, we have to specify a fee, sequence and maxLedgerVersion.
      dlt: DltNames.xrp, //which DLT to use
      toAddress: partyBRippleAddress, //which address/account this message is being sent to
      message: transactionMessage, //any message you want to write
      options: {
        amount: '30000000', // The amount of Drops you want to send. Minimum send is 1 drop. 1 drop = 0.000001 XRP.
        sequence: rippleAccountSequence, // Sequence increases by 1 with each transaction and starts at 1 right after getting the address from the XRP testnet faucet. As previously discussed OVL finds the correct sequence
        feePrice: '12', // FeePrice is denoted in drops. Minimum feePrice on XRP is 12 drops for escrowCreation (also for the other transaction types of escrowCancelation & payment).
        maxLedgerVersion: '4294967295', // The maximum ledger version the transaction can be included in.
        transactionType: TransactionTypes.escrowCreation, //what type of transaction are we signing? See the enum for options
        atomicSwapParameters: {
          allowExecuteAfter: escrowExecutionAfter.toISOString(),//'2019-19-15T15:36:01.325Z', //from when can the escrow be executed?
          allowCancelAfter: escrowCancelationAfter.toISOString(),//'2019-19-14T18:00:01.325Z', //from when can the escrow be cancelled?
          hashAlgorithmInput: 'Test' //This is the input to the hashing algorithm used to lock the escrow. This input will not be revealed on the ledger until escrow execution.
        }
      },
    },]);

    // The signed transaction can now be sent to Overledger.
    const result = (await overledger.send(signedTransactions)).data;

    // Log the result.
    console.log(JSON.stringify(result, null, 2));

  } catch (e) {
    console.error('error:', e);
  }
})();