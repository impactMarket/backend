import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';

import { startServer } from '../../src/api/app';

chai.use(chaiHttp);

describe('community API request', () => {
    let requester: ChaiHttp.Agent;

    before(async () => {
        requester = chai.request(await startServer()).keepOpen();
    });

    after(async () => {
        await requester.close();
    });

    it('verify /status', async () => {
        const res = await requester.get('/status');
        expect(res).to.have.status(200);
        // eslint-disable-next-line no-unused-expressions
        expect(res.body).to.be.empty;
    });
});
