import Dlt from '../src';
import OverledgerSDK from '@overledger/core';

describe('Dlt', () => {
  test('Can construct the Dlt with the index or dlt', () => {
    const mappId = 'mockMappId';
    const bpiKey = 'mockBpiKey';

    const options = {
      privateKey: 'ssRsTvdBvRs8443xvzFV6nP6McARQ',
    };
    const sdkOptions = {
      dlts: [
        { dlt: 'ripple', ...options },
      ],
    };

    const sdk = new OverledgerSDK(mappId, bpiKey, sdkOptions);
    const dlt = new Dlt(sdk, options);

    expect(sdk.dlts.ripple.name).toEqual(dlt.name);
    expect(sdk.dlts.ripple.rippleAPI).toEqual(dlt.rippleAPI);
    expect(sdk.dlts.ripple.account).toEqual(dlt.account);
  });
});
