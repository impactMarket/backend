import { BigNumber } from 'bignumber.js';
import { expect } from 'chai';

import { calculateGrowth } from '../../../src/utils/util';

BigNumber.config({ EXPONENTIAL_AT: [-7, 30] });

describe('#calculateGrowth()', () => {
    describe('normal', () => {
        it('number', async () => {
            expect(calculateGrowth(205, 310)).to.be.equal(51.2);
        });

        it('bigint', async () => {
            expect(calculateGrowth(BigInt(205), BigInt(310))).to.be.equal(51.2);
        });

        it('bignumber', async () => {
            expect(calculateGrowth('205', '310')).to.be.equal(51.2);
        });
    });

    describe('almost max', () => {
        it('number', async () => {
            expect(calculateGrowth(1147483647, 2147483646)).to.be.equal(87.1);
        });

        it('bigint', async () => {
            expect(calculateGrowth(BigInt('8223372036854775807'), BigInt('9223372036854775807'))).to.be.equal(12.2);
        });

        it('bignumber', async () => {
            expect(calculateGrowth('699999999999000000000000000000', '999999999999000000000000000000')).to.be.equal(
                42.9
            );
        });
    });
});
