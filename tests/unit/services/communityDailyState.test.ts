import { stub } from 'sinon';
import SequelizeMock from 'sequelize-mock';

import CommunityDailyStateService from '../../../src/services/communityDailyState';

describe('communityDailyState', () => {
    describe('#getPublicCommunitiesSum()', () => {
        it('get sum of values', async () => {
            // Setup the mock database connection
            var DBConnectionMock = new SequelizeMock();

            // Define our Model
            var communityDailyStateMock = DBConnectionMock.define(
                'communitydailystate',
                [
                    {
                        communityId: '09927447-f26d-49f1-b8cf-ea424fad3fba',
                        claimed: '4500000000000000000',
                        claims: 3,
                        beneficiaries: 0,
                        raised: 0,
                        backers: 0,
                        date: '2021-01-31',
                    },
                    {
                        communityId: '3575db8b-c2ab-4822-9f7c-fc4ae1bad934',
                        claimed: '775500000000000000000',
                        claims: 517,
                        beneficiaries: 0,
                        raised: '2000183073064460026000',
                        backers: 0,
                        date: '2021-01-31',
                    },
                    {
                        communityId: '294c7da0-a01d-41a1-98a3-bf60c20694a2',
                        claimed: '856500000000000000000',
                        claims: 571,
                        beneficiaries: 3,
                        raised: '2000000000000000000000',
                        backers: 0,
                        date: '2021-01-31',
                    },
                ]
            );
            var communityMock = DBConnectionMock.define('community', [
                {
                    publicId: '3575db8b-c2ab-4822-9f7c-fc4ae1bad934',
                    visibility: 'public',
                    status: 'valid',
                },
                {
                    publicId: '294c7da0-a01d-41a1-98a3-bf60c20694a2',
                    visibility: 'public',
                    status: 'valid',
                    started: '2020-12-10',
                },
                {
                    publicId: 'a21d82da-fe5c-4a3e-99d8-f517ad7cdb83',
                    visibility: 'public',
                    status: 'valid',
                },
                {
                    publicId: '9a617d39-931a-4df1-869b-45ed13b09b15',
                    visibility: 'private',
                    status: 'valid',
                },
                {
                    publicId: 'dc2ed591-8443-4e53-9ab2-d97aa1afcd44',
                    visibility: 'public',
                    status: 'pending',
                },
            ]);
            

            // stub(CommunityDailyStateService, 'sequelize').returns(DBConnectionMock);

            // From there we can start using it like a normal model
            // const r = await CommunityDailyStateService.getPublicCommunitiesSum();
            // console.log(r);
        });
    });
});
