import { Transactions } from '@models/transactions';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { LogDescription } from 'ethers/lib/utils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _ from 'lodash';
import { SHA3 } from 'sha3';

interface ICommunityAddedEventValues {
    _communityAddress: string;
    _firstManager: string;
    _claimAmount: BigNumber;
    _maxClaim: BigNumber;
    _baseInterval: BigNumber;
    _incrementInterval: BigNumber;
}
interface ICommunityEditedEventValues {
    _claimAmount: BigNumber;
    _maxClaim: BigNumber;
    _baseInterval: BigNumber;
    _incrementInterval: BigNumber;
}
interface IBeneficiaryClaimEventValues {
    _account: string;
    _amount: BigNumber;
}
interface ITransferEventValues {
    from: string;
    to: string;
    value: BigNumber;
}

export function translateEvent(
    rawValues:
        | ICommunityAddedEventValues
        | ICommunityEditedEventValues
        | IBeneficiaryClaimEventValues
        | ITransferEventValues
        | { _account: string }
): any {
    if ((rawValues as ICommunityAddedEventValues)._firstManager) {
        const values = rawValues as ICommunityAddedEventValues;
        return {
            _communityAddress: values._communityAddress,
            _firstManager: values._firstManager,
            _claimAmount: values._claimAmount.toString(),
            _maxClaim: values._maxClaim.toString(),
            _baseInterval: values._baseInterval.toString(),
            _incrementInterval: values._incrementInterval.toString(),
        };
    } else if ((rawValues as ITransferEventValues).from) {
        const values = rawValues as ITransferEventValues;
        return {
            from: values.from,
            to: values.to,
            value: values.value.toString(),
        };
    } else if ((rawValues as IBeneficiaryClaimEventValues)._amount) {
        const values = rawValues as IBeneficiaryClaimEventValues;
        return {
            _account: values._account,
            _amount: values._amount.toString(),
        };
    } else if ((rawValues as ICommunityEditedEventValues)._claimAmount) {
        const values = rawValues as ICommunityEditedEventValues;
        return {
            _claimAmount: values._claimAmount.toString(),
            _maxClaim: values._maxClaim.toString(),
            _baseInterval: values._baseInterval.toString(),
            _incrementInterval: values._incrementInterval.toString(),
        };
    }
    // everything else
    const values = rawValues as { _account: string };
    return {
        _account: values._account,
    };
}

export default class TransactionsService {
    /**
     * @deprecated
     */
    public static async add(
        provider: ethers.providers.JsonRpcProvider,
        logs: ethers.providers.Log,
        events: LogDescription
    ): Promise<void> {
        const tx = logs.transactionHash!;
        const txReceipt = await provider.getTransactionReceipt(tx);
        const from = txReceipt.from!;
        // const block = await provider.getBlock(txReceipt.blockHash!);
        const contractAddress = logs.address;
        const event = events.name;
        const values = translateEvent(events.args as any);

        return this.addRaw(
            tx,
            new Date(),
            from,
            contractAddress,
            event,
            values
        );
    }

    /**
     * @deprecated
     */
    public static async addRaw(
        tx: string,
        txAt: Date,
        from: string,
        contractAddress: string,
        event: string,
        values: unknown // values from events can have multiple forms
    ): Promise<void> {
        try {
            const hash = new SHA3(256);
            hash.update(tx).update(JSON.stringify(values));
            await Transactions.create({
                uid: hash.digest('hex'),
                tx,
                txAt,
                from,
                contractAddress,
                event,
                values,
            });
        } catch (e) {
            //e
        }
    }
}
