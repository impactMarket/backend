import { models } from '../../database';
import { getBorrowers, getLoanRepayments } from '../../subgraph/queries/microcredit';
import { getAddress } from '@ethersproject/address';
import { JsonRpcProvider } from '@ethersproject/providers';
import { MicrocreditABI as MicroCreditABI } from '../../contracts';
import { BigNumber, Contract } from 'ethers';
import { config } from '../../..';

function mergeArrays(arr1: any[], arr2: any[], key: string) {
    const map = new Map(arr1.map(item => [item[key], item]));
    arr2.forEach(item => {
        map.has(item[key]) ? Object.assign(map.get(item[key]), item) : map.set(item[key], item);
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
                lastRepaymentAmount: string;
                lastDebt: string;
            };
        }[]
    > => {
        // get borrowers loans from subgraph
        // and return only the active loan (which is only one)
        const borrowers = (await getBorrowers({ ...query, claimed: true })).map(b => ({ ...b, loans: b.loans[0] }));

        // get borrowers profile from database
        const userProfile = await models.appUser.findAll({
            attributes: ['address', 'firstName', 'lastName', 'avatarMediaPath'],
            where: {
                address: borrowers.map(b => getAddress(b.id))
            }
        });

        // merge borrowers loans and profile
        return mergeArrays(
            borrowers.map(b => ({ address: getAddress(b.id), ...b })),
            userProfile.map(u => u.toJSON()),
            'address'
        );
    };

    /**
     * @swagger
     *  components:
     *    schemas:
     *      getRepaymentsHistory:
     *        type: object
     *        properties:
     *          count:
     *            type: number
     *            description: total number of repayments
     *            example: 5
     *          repayments:
     *            type: array
     *            items:
     *              type: object
     *              properties:
     *                index:
     *                  type: number
     *                  description: repayment index
     *                  example: 1
     *                amount:
     *                  type: number
     *                  description: repayment amount
     *                  example: 7
     *                debt:
     *                  type: number
     *                  description: remain debt after repayment
     *                  example: 45
     *                timestamp:
     *                  type: number
     *                  description: repayment timestamp in seconds
     *                  example: 1623352800
     */
    /**
     * Using ethers underneath, get the repayment history of a borrower
     * @param query query params
     */
    public getRepaymentsHistory = async (query: {
        offset?: number;
        limit?: number;
        loanId: number;
        borrower: string;
    }): Promise<{
        count: number;
        repayments: {
            index: number;
            amount: number;
            debt: number;
            timestamp: number;
        }[];
    }> => {
        const { borrower, loanId, offset, limit } = query;
        const provider = new JsonRpcProvider(config.jsonRpcUrl);
        const microcredit = new Contract(config.microcreditContractAddress, MicroCreditABI, provider);
        const totalRepayments = await getLoanRepayments(borrower, loanId);

        const repaymentsPromise: { date: number; amount: BigNumber }[] = [];
        // iterates from offset (or zero if offset not defined) to offset + the min between totalRepayments and limit (or 10 if limit not defined)
        for (let i = offset ?? 0; i < (offset ?? 0) + Math.min(totalRepayments, limit ?? 10); i++) {
            repaymentsPromise.push(microcredit.userLoanRepayments(borrower, loanId, i));
        }

        const repayments = await Promise.all(repaymentsPromise);

        return {
            count: totalRepayments,
            repayments: repayments.map((r, i) => ({
                index: repayments.length - i,
                amount: r.amount.div(BigNumber.from(10).pow(18)).toNumber(),
                debt: 0,
                timestamp: parseInt(r.date.toString(), 10)
            }))
        };
    };

    /**
     * Get borrower profile, including docs and loans
     * @param address borrower address
     */
    public getBorrower = async (query: { address: string }) => {
        const { address } = query;
        const borrower = await models.appUser.findOne({
            attributes: ['id', 'address', 'firstName', 'lastName', 'avatarMediaPath'],
            where: {
                address
            }
        });

        if (!borrower) {
            throw new Error('Borrower not found');
        }

        const docs = await models.microCreditDocs.findAll({
            attributes: ['filepath', 'category'],
            where: {
                userId: borrower.id
            }
        });

        return {
            ...borrower.toJSON(),
            docs: docs.map(d => d.toJSON())
        };
    };
}
