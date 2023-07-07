import { Request, Response } from 'express';
import { database } from '@impactmarket/core';
import { ethers } from 'ethers';

const getAirgrab = async (req: Request, res: Response) => {
    const { address } = req.params;
    try {
        const user = (await database.models.airgrabUser.findOne({
            attributes: {
                exclude: ['id', 'address']
            },
            where: {
                address: ethers.utils.getAddress(address)
            },
            include: [
                {
                    model: database.models.airgrabProof,
                    as: 'proof',
                    separate: true
                }
            ]
        }))!.toJSON();

        user.proof = user.proof?.map(el => el.hashProof) as any;

        res.send(user);
    } catch (_) {
        res.send({});
    }
};

export default {
    getAirgrab
};
