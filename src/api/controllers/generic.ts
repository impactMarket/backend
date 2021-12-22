import { Contract, ethers } from 'ethers';
import { Request, Response } from 'express';
import ERC20ABI from '../../contracts/ERC20ABI.json';
import { BigNumber } from 'bignumber.js';

import config from '../../config';

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
    const totalSupply = new BigNumber(10000000000).multipliedBy(10 ** 18);
    const circulatingSupply = new BigNumber(totalSupply)
        .minus(airgrabPACTBalance.toString())
        .minus(daoPACTBalance.toString())
        .minus(donationMinerPACTBalance.toString())
        .minus(impactLabsPACTBalance.toString());
    const response = circulatingSupply.dividedBy(10 ** 18).toNumber();
    res.send(response.toString());
};

export default {
    circulatingSupply,
};
