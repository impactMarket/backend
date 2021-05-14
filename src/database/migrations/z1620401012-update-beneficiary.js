'use strict';

const { ethers } = require('ethers');
const CommunityContractABI = require('../../contracts/CommunityABI.json');

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        try {
            const r = await queryInterface.sequelize.query(
                `select address, "contractAddress", "publicId" from community c, beneficiary b where c."publicId" = b."communityId" and b.active = false`,
                { raw: true, type: Sequelize.QueryTypes.SELECT }
            );

            // console.log(r);

            const provider = new ethers.providers.JsonRpcProvider(
                process.env.CHAIN_JSON_RPC_URL
            );

            let updated = 0;

            for (let index = 0; index < r.length; index++) {
                const e = r[index];
                const communityContract = new ethers.Contract(
                    e.contractAddress,
                    CommunityContractABI,
                    provider
                );
                const isBeneficiary = await communityContract.beneficiaries(
                    e.address
                );
                // console.log(isBeneficiary);
                if (isBeneficiary === 1) {
                    updated++;
                    await queryInterface.sequelize.query(
                        `update beneficiary set active = true where address = '${e.address}' and "communityId" = '${e.publicId}'`
                    );
                }
            }
            console.log('updated ' + updated);
        } catch (e) {
            console.log(e);
        }
    },

    down(queryInterface, Sequelize) {},
};
