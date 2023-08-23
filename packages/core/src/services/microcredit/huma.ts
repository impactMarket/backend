import { ARWeaveService, ReceivableService, getBundlrNetworkConfig } from '@huma-finance/sdk';
import { ChainEnum, POOL_NAME, POOL_TYPE } from '@huma-finance/shared';
import { DbModels } from '../../database/db';
import { Logger } from '../../utils';
import { Wallet, ethers } from 'ethers';
import { sequelize } from '../../database';
import config from '../../config';

type Loan = {
    borrower: string;
    loanId: number;
    amount: number;
    period: number;
    // The timestamp at which the loan was claimed
    claimedAt: number;
    paymentAmount?: number;
};

/*
 * We use Bundlr to upload metadata to ARWeave, which allows for users to pay in popular currencies like MATIC or ETH
 * instead of AR tokens. Certain networks that are still unsupported by Bundlr (e.g. Celo) can still use Bundlr to
 * fund the ARWeave uploads by simply paying on a supported network.
 *
 * This snippet shows how to use a wallet with MATIC to fund the ARWeave uploads, and then that same wallet on
 * a separate network to upload a RealWorldReceivable with the resulting metadata URI.
 */
export async function registerReceivables(loans: Loan[]) {
    const { appUser, microCreditBorrowersHuma } = sequelize.models as DbModels;

    let bundlrProviderNetworkDetails: ethers.providers.Networkish = {
        name: 'Mumbai',
        chainId: ChainEnum.Mumbai
    };
    let rwrProviderNetworkDetails: ethers.providers.Networkish = {
        name: 'Alfajores',
        chainId: ChainEnum.Alfajores
    };
    if (config.chain.isMainnet) {
        bundlrProviderNetworkDetails = {
            name: 'Polygon',
            chainId: ChainEnum.Polygon
        };
        rwrProviderNetworkDetails = {
            name: 'Celo',
            chainId: ChainEnum.Celo
        };
    }
    const poolName = POOL_NAME.ImpactMarket;

    // We'll be using a mumbai wallet funded with MATIC to pay for the ARWeave uploads
    const bundlrProvider = new ethers.providers.StaticJsonRpcProvider(
        config.chain.jsonRPCUrlPolygon,
        bundlrProviderNetworkDetails
    );
    const walletOnSupportedBundlrNetwork = new Wallet(config.hotWallets.huma, bundlrProvider);

    // On a separate network which may not be supported by Bundlr, we'll use our wallet
    // to create a RealWorldReceivable with the metadata URI from ARWeave
    const rwrProvider = new ethers.providers.StaticJsonRpcProvider(
        config.chain.jsonRPCUrlCelo,
        rwrProviderNetworkDetails
    );
    const walletOnRWRNetwork = new Wallet(config.hotWallets.huma, rwrProvider);

    // Check if Bundlr has sufficient balance to pay for the ARWeave upload
    const bundlrInstance = await ARWeaveService.getBundlrInstance(
        getBundlrNetworkConfig(bundlrProviderNetworkDetails.chainId),
        config.hotWallets.huma
    );
    const balance = await bundlrInstance.getBalance(walletOnSupportedBundlrNetwork.address);

    if (balance.lt(ethers.utils.parseEther('0.05').toString())) {
        Logger.info('Insufficient balance. Executing prefundBundlr...');

        // Prefund Bundlr with MATIC
        const fundResponse = await ARWeaveService.prefundBundlr(
            getBundlrNetworkConfig(bundlrProviderNetworkDetails.chainId),
            config.hotWallets.huma,
            0.05 // Fund with 0.05 matic
        );
        Logger.debug(fundResponse);
        Logger.info('ARWeaveService funded!');
    }

    for (let i = 0; i < loans.length; i++) {
        const { borrower, loanId, amount, claimedAt, period } = loans[i];
        // Upload metadata to ARWeave
        const uri = await ReceivableService.uploadOrFetchMetadataURI(
            walletOnSupportedBundlrNetwork,
            config.hotWallets.huma,
            bundlrProviderNetworkDetails.chainId,
            poolName,
            POOL_TYPE.CreditLine,
            { borrower, loanId }, // metadata
            `${borrower}-${loanId}`, // referenceId
            [{ name: 'indexedIdentifier', value: 'exampleValue' }] // extraTags
        );

        // Mint a receivable with metadata uploaded to ARWeave
        const tx = await ReceivableService.createReceivable(
            walletOnRWRNetwork,
            poolName,
            POOL_TYPE.CreditLine,
            840, // currencyCode for USD
            amount, // receivableAmount
            claimedAt + period, // maturityDate
            uri // metadataURI
        );
        await tx.wait();
        console.log({ tx });

        // register receivable to backend
        appUser.findOne({ where: { address: borrower } }).then(user =>
            user && microCreditBorrowersHuma.create({
                userId: user.id,
                humaRWRReferenceId: `${borrower}-${loanId}`
            })
        );
    }
}

export async function registerReceivablesRepayments(loans: Loan[]) {
    let rwrProviderNetworkDetails: ethers.providers.Networkish = {
        name: 'Alfajores',
        chainId: ChainEnum.Alfajores
    };
    if (config.chain.isMainnet) {
        rwrProviderNetworkDetails = {
            name: 'Celo',
            chainId: ChainEnum.Celo
        };
    }

    const rwrProvider = new ethers.providers.StaticJsonRpcProvider(
        config.chain.jsonRPCUrlCelo,
        rwrProviderNetworkDetails
    );
    const walletOnRWRNetwork = new Wallet(config.hotWallets.huma, rwrProvider);

    for (let i = 0; i < loans.length; i++) {
        const { borrower, loanId, paymentAmount } = loans[i];
        await ReceivableService.declareReceivablePaymentByReferenceId(
            walletOnRWRNetwork,
            `${borrower}-${loanId}`, // referenceId
            paymentAmount!
        );
    }
}
