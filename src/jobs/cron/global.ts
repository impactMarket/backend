import { ethers } from 'ethers';
import config from '../../config';
import Logger from '../../loaders/logger';
import ImMetadataService from '../../services/imMetadata';
import ERC20ABI from '../../contracts/ERC20ABI.json';
import UserService from '../../services/user';
import BigNumber from 'bignumber.js';


export async function calcuateGlobalMetrics(): Promise<void> {
    Logger.info('Calculating global metrics...');
    const provider = new ethers.providers.JsonRpcProvider(config.jsonRpcUrl);
    const cUSDContract = new ethers.Contract(config.cUSDContractAddress, ERC20ABI, provider);
    const queryFilterLastBlock = await ImMetadataService.getQueryFilterLastBlock();
    const allUsersAddress = await UserService.getAllAddresses();

    const currentBlockNumber = await provider.getBlockNumber();
    const fromUsers = await cUSDContract.queryFilter(
        cUSDContract.filters.Transfer(allUsersAddress),
        queryFilterLastBlock,
        'latest'
    );
    const toUsers = await cUSDContract.queryFilter(
        cUSDContract.filters.Transfer(null, allUsersAddress),
        queryFilterLastBlock,
        'latest'
    );

    const addressFromUsers: string[] = fromUsers.map((u) => u.args!.to);
    const addressToUsers: string[] = toUsers.map((u) => u.args!.from);

    const amountFromUsers: string[] = fromUsers.map((u) => u.args!.value.toString());
    const amountToUsers: string[] = toUsers.map((u) => u.args!.value.toString());

    // metrics
    const volume = amountFromUsers.concat(amountToUsers).reduce<BigNumber>(
        (previousValue: BigNumber, currentValue: string) => previousValue.plus(currentValue),
        new BigNumber(0)
    ).toString();
    const transactions = fromUsers.length + toUsers.length;
    const reach = new Set(addressFromUsers.concat(addressToUsers));

    console.log(fromUsers, toUsers);

    // save currentBlockNumber as QueryFilterLastBlock
    ImMetadataService.setQueryFilterLastBlock(currentBlockNumber);
}
