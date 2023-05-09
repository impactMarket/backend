import { models } from '../../database';
import { getBorrowers } from '../../subgraph/queries/microcredit';
import { getAddress } from '@ethersproject/address';

function mergeArrays(arr1: any[], arr2: any[], key: string) {
    const map = new Map(arr1.map((item) => [item[key], item]));
    arr2.forEach((item) => {
        map.has(item[key])
            ? Object.assign(map.get(item[key]), item)
            : map.set(item[key], item);
    });
    return Array.from(map.values());
}

export default class MicroCreditList {
    public listBorrowers = async (query: {
        offset?: number;
        limit?: number;
        addedBy?: string;
    }): Promise<
        {
            address: string;
            firstName: string;
            lastName: string;
            avatarMediaPath: string;
            loans: {
                amount: string;
                period: number;
                dailyInterest: number;
                claimed: number;
                repayed: string;
                lastRepayment: number;
            };
        }[]
    > => {
        // get borrowers loans from subgraph
        // and return only the active loan (which is only one)
        const borrowers = (await getBorrowers({ ...query, claimed: true })).map((b) => ({ ...b, loans: b.loans[0] }));

        // get borrowers profile from database
        const userProfile = await models.appUser.findAll({
            attributes: ['address', 'firstName', 'lastName', 'avatarMediaPath'],
            where: {
                address: borrowers.map((b) => getAddress(b.id)),
            },
        });

        // merge borrowers loans and profile
        return mergeArrays(
            borrowers.map((b) => ({ address: getAddress(b.id), ...b })),
            userProfile.map((u) => u.toJSON()),
            'address'
        );
    };
}
