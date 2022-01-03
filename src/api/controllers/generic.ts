import { BigNumber } from 'bignumber.js';
import { Contract, ethers } from 'ethers';
import { Request, Response } from 'express';

import config from '../../config';
import ERC20ABI from '../../contracts/ERC20ABI.json';
import { models } from '../../database';

const circulatingSupply = async (req: Request, res: Response) => {
    const pact = new Contract(
        config.contractAddresses.pact,
        ERC20ABI,
        new ethers.providers.JsonRpcProvider(config.jsonRpcUrl)
    );
    const airgrabPACTBalance = await pact.balanceOf(
        config.contractAddresses.airgrab
    );
    const daoPACTBalance = await pact.balanceOf(config.contractAddresses.dao);
    const donationMinerPACTBalance = await pact.balanceOf(
        config.contractAddresses.donationMiner
    );
    const impactLabsPACTBalance = await pact.balanceOf(
        config.contractAddresses.impactLabs
    );
    const idoPACTBalance = await pact.balanceOf(config.contractAddresses.ido);
    const totalSupply = new BigNumber(10000000000).multipliedBy(10 ** 18);
    const circulatingSupply = new BigNumber(totalSupply)
        .minus(airgrabPACTBalance.toString())
        .minus(daoPACTBalance.toString())
        .minus(donationMinerPACTBalance.toString())
        .minus(impactLabsPACTBalance.toString())
        .minus(idoPACTBalance.toString());
    const response = circulatingSupply.dividedBy(10 ** 18).toNumber();
    res.send(response.toString());
};

const getAirgrab = async (req: Request, res: Response) => {
    const { address } = req.params;
    try {
        const user = (await models.airgrabUser.findOne({
            attributes: {
                exclude: ['id', 'address'],
            },
            where: {
                address: ethers.utils.getAddress(address),
            },
            include: [
                {
                    model: models.airgrabProof,
                    as: 'proof',
                    separate: true,
                },
            ],
        }))!.toJSON();

        user['proof'] = user['proof'].map((el) => el.hashProof);

        res.send(user);
    } catch (_) {
        res.send({});
    }
};

export default {
    circulatingSupply,
    getAirgrab,
};
