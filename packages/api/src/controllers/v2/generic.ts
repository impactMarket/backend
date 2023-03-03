import { getAddress } from '@ethersproject/address';
import { database, services } from '@impactmarket/core';
import { Request, Response } from 'express';

import { standardResponse } from '../../utils/api';

class GenericController {
    private cashoutProviderService: services.app.CashoutProviderService;
    constructor() {
        this.cashoutProviderService = new services.app.CashoutProviderService();
    }

    exchangeRates = (req: Request, res: Response) => {
        database.models.exchangeRates
            .findAll({
                attributes: ['currency', 'rate'],
            })
            .then((rates) =>
                standardResponse(
                    res,
                    200,
                    true,
                    rates.map((rate) => rate.toJSON())
                )
            )
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    getWalletAirdrop = async (req: Request, res: Response) => {
        const { address } = req.params;
        try {
            const walletAirdrop =
                await database.models.walletAirdropUser.findOne({
                    attributes: {
                        exclude: ['id', 'address'],
                    },
                    where: {
                        address: getAddress(address),
                    },
                    include: [
                        {
                            model: database.models.walletAirdropProof,
                            as: 'proof',
                            separate: true,
                        },
                    ],
                });

            if (!walletAirdrop) {
                return standardResponse(res, 400, false, '', {
                    error: {
                        name: 'USER_NOT_FOUND',
                        message: 'user not found',
                    },
                });
            }
            const airdropJson = walletAirdrop.toJSON();
            airdropJson.proof = airdropJson.proof?.map(
                (el) => el.hashProof
            ) as any;

            return standardResponse(res, 200, true, airdropJson);
        } catch (e) {
            return standardResponse(res, 400, false, '', { error: e });
        }
    };

    getCashoutProviders = (req: Request, res: Response) => {
        this.cashoutProviderService
            .get(req.query)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}

export default GenericController;
