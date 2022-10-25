import { getAddress } from '@ethersproject/address';
import { services, database } from '@impactmarket/core';
import { Request, Response } from 'express';

import { standardResponse } from '../../utils/api';

class GenericController {
    private exchangeRatesService: services.app.ExchangeRatesService;
    constructor() {
        this.exchangeRatesService = new services.app.ExchangeRatesService();
    }

    exchangeRates = (req: Request, res: Response) => {
        this.exchangeRatesService
            .get()
            .then((r) => standardResponse(res, 200, true, r))
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
}

export default GenericController;
