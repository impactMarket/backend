import { BigNumber } from 'bignumber.js';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Request, Response } from 'express';
import { config, contracts } from '@impactmarket/core';

// this is required for external services to access the circulating supply
export const circulatingSupply = async (_req: Request, res: Response) => {
    const decimals = new BigNumber(10).pow(18);
    const pact = new Contract(
        config.contractAddresses.pact,
        contracts.ERC20ABI,
        new JsonRpcProvider(config.jsonRpcUrl)
    );
    const topHolders = [
        '0xBD11CaeA0a854ba328e202ceD2F0269fD8027c6e',
        '0x59aAc0b8bd03b7Ba9D391Eb989c3Ea8CdE638144',
        '0x73cD8626b3cD47B009E68380720CFE6679A3Ec3D',
        '0x3844cb665cf676B1Eb7C896E04D3E9eC3BAB5a75',
        '0x213962Ba8e4cef1D618c88d62D2FFA39eC5Eb22D',
        '0x1854c78e5401A501A8F32f3a9DFae3d356Fb9A9E'
    ]
    const topHoldersBalances = await Promise.all(
        topHolders.map(holder => pact.balanceOf(holder))
    );

    const totalSupply = new BigNumber(100_000_000_000).multipliedBy(decimals);
    let circulatingSupply = new BigNumber(totalSupply)
    topHoldersBalances.forEach(balance => {
        circulatingSupply = circulatingSupply.minus(balance.toString());
    });

    const response = circulatingSupply.dividedBy(decimals).toNumber();

    // answer
    res.send(response.toString());
};
