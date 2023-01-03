import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { config, contracts } from '@impactmarket/core';
import { BigNumber } from 'bignumber.js';
import { Request, Response } from 'express';

// this is required for external services to access the circulating supply
export const circulatingSupply = async (_req: Request, res: Response) => {
    const decimals = new BigNumber(10).pow(18);
    const pact = new Contract(
        config.contractAddresses.pact,
        contracts.ERC20ABI,
        new JsonRpcProvider(config.jsonRpcUrl)
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
    const totalSupply = new BigNumber(10000000000).multipliedBy(decimals);
    const circulatingSupply = new BigNumber(totalSupply)
        .minus(airgrabPACTBalance.toString())
        .minus(daoPACTBalance.toString())
        .minus(donationMinerPACTBalance.toString())
        .minus(impactLabsPACTBalance.toString())
        .minus(idoPACTBalance.toString());
    const response = circulatingSupply.dividedBy(decimals).toNumber();

    // answer
    res.send(response.toString());
};
