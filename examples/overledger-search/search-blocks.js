const OverledgerSDK = require('@quantnetwork/overledger-bundle').default;
const DltNameOptions = require('@quantnetwork/overledger-types').DltNameOptions;

//  ---------------------------------------------------------
//  -------------- BEGIN VARIABLES TO UPDATE ----------------
//  ---------------------------------------------------------
const mappId = 'network.quant.software';
const bpiKey = 'bpikeytest';

// Take these from the search-transaction scripts, as the response
// includes what block the transaction is included in
const ethereumBlockNumber = '1000000';
const rippleBlockNumber = '4531496';
const bitcoinBlockNumber = '1000002';

//  ---------------------------------------------------------
//  -------------- END VARIABLES TO UPDATE ------------------
//  ---------------------------------------------------------

; (async () => {
    try {
        const overledger = new OverledgerSDK(mappId, bpiKey, {
            dlts: [{ dlt: DltNameOptions.bitcoin }, { dlt: DltNameOptions.ethereum }, { dlt: DltNameOptions.xrp }],
            provider: { network: 'testnet' },

        });

        const bitcoinBlock = await overledger.search.getBlockByDltAndNumber('bitcoin', bitcoinBlockNumber);
        console.log('Bitcoin block: ', bitcoinBlock.data);
        console.log('\n');
        
        const ethereumBlock = await overledger.search.getBlockByDltAndNumber('ethereum', ethereumBlockNumber);
        console.log('Ethereum block: ', ethereumBlock.data);
        console.log('\n');

        const rippleBlock = await overledger.search.getBlockByDltAndNumber('ripple', rippleBlockNumber);
        console.log('Ripple block: ', rippleBlock.data);
        console.log('\n');

    } catch (e) {
        console.error('error', e.response.data);
    }
})();