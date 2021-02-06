import { CommunityContract } from '../../src/database/models/communityContract';

export const now = new Date();
export const nowTimestamp = now.getTime();

export const communityIds = [
    // more than 30 days, fully running
    'c77a15a7-2cef-4d1e-96db-afd0b91ab71d',
    'b090d41f-91c0-4f18-a809-633217590bbb',
    'a3b4ad6e-dc8e-4861-b5b2-c1973907c515',
    // running for less that 30 days, fully running
    'ffb2fa59-78c6-4378-82a8-2a28f9056c3d',
    'fa12164c-3039-47e1-9005-aaad668215ee',
    // no beneficiaries
    '2c0f816e-3475-4d4a-847f-13fb141993f6',
];

export const totalClaimedLast30Days = new Map<string, string>();
totalClaimedLast30Days.set(communityIds[0], '2516000000000000000000');
totalClaimedLast30Days.set(communityIds[1], '148000000000000000000');
totalClaimedLast30Days.set(communityIds[2], '1903500000000000000000');
totalClaimedLast30Days.set(communityIds[3], '52000000000000000000');
totalClaimedLast30Days.set(communityIds[4], '25000000000000000000');
totalClaimedLast30Days.set(communityIds[5], '0');

export const ssiLast4Days = new Map<string, number[]>();
ssiLast4Days.set(communityIds[0], [0.92, 0.87, 1.2, 1.5]);
ssiLast4Days.set(communityIds[1], [1.3, 2.5, 2.3, 2]);
ssiLast4Days.set(communityIds[2], [0.8, 0.9, 1.2, 1.3]);
ssiLast4Days.set(communityIds[3], [1.0, 1.2, 1.8, 1.1]);
ssiLast4Days.set(communityIds[4], [0.7, 0.5, 0.4, 0.5]);
ssiLast4Days.set(communityIds[5], []);

export const communitiesContract = new Map<string, CommunityContract>();
communitiesContract.set(
    communityIds[0],
    new CommunityContract({
        communityId: communityIds[0],
        claimAmount: '2000000000000000000',
        maxClaim: '1500000000000000000000',
        baseInterval: 86400,
        incrementInterval: 600,
    })
);
communitiesContract.set(
    communityIds[1],
    new CommunityContract({
        communityId: communityIds[1],
        claimAmount: '1000000000000000000',
        maxClaim: '600000000000000000000',
        baseInterval: 86400,
        incrementInterval: 300,
    })
);
communitiesContract.set(
    communityIds[2],
    new CommunityContract({
        communityId: communityIds[2],
        claimAmount: '1500000000000000000',
        maxClaim: '300000000000000000000',
        baseInterval: 86400,
        incrementInterval: 900,
    })
);
communitiesContract.set(
    communityIds[3],
    new CommunityContract({
        communityId: communityIds[3],
        claimAmount: '1500000000000000000',
        maxClaim: '300000000000000000000',
        baseInterval: 86400,
        incrementInterval: 600,
    })
);
communitiesContract.set(
    communityIds[4],
    new CommunityContract({
        communityId: communityIds[4],
        claimAmount: '1000000000000000000',
        maxClaim: '300000000000000000000',
        baseInterval: 86400,
        incrementInterval: 600,
    })
);
communitiesContract.set(
    communityIds[5],
    new CommunityContract({
        communityId: communityIds[5],
        claimAmount: '1000000000000000000',
        maxClaim: '300000000000000000000',
        baseInterval: 86400,
        incrementInterval: 600,
    })
);

// TODO: fix type
export const validNonEmptyMonthLongCommunities: any[] = [
    {
        publicId: communityIds[0],
        contractAddress: '0xFdd8bD58115FfBf04e47411c1d228eCC45E93075',
        state: {
            claimed: '3946000000000000000000',
            raised: '4340003115106414976421',
        },
        contract: communitiesContract.get(communityIds[0])!,
        started: new Date(nowTimestamp - 4752000000), // 55×24×60×60×1000
    },
    {
        publicId: communityIds[1],
        contractAddress: '0x510Bf5D8feBCA69fCfe73d391783be01B3324c69',
        state: {
            claimed: '163000000000000000000',
            raised: '200000000000000000000',
        },
        contract: communitiesContract.get(communityIds[1])!,
        started: new Date(nowTimestamp - 3888000000), // 45×24×60×60×1000
    },
    {
        publicId: communityIds[2],
        contractAddress: '0x473a3be7C2A42452Ed0b521614B3b76BC59D2D1D',
        state: {
            claimed: '2068500000000000000000',
            raised: '2780008138099262974802',
        },
        contract: communitiesContract.get(communityIds[2])!,
        started: new Date(nowTimestamp - 3542400000), // 41×24×60×60×1000
    },
];

// TODO: fix type
export const validNonEmptyLessThanMonthLongCommunities: any[] = [
    {
        publicId: communityIds[3],
        contractAddress: '0xD7C06AfE310baCD786BA2929088298b9e60322ec',
        state: {
            claimed: '20500000000000000000',
            raised: '37000813809929748020',
        },
        contract: communitiesContract.get(communityIds[3])!,
        started: new Date(nowTimestamp - 2160000000), // 25×24×60×60×1000
    },
    {
        publicId: communityIds[4],
        contractAddress: '0xFdd8bD58115FfBf04e47411c1d228eCC45E93075',
        state: {
            claimed: '3200000000000000000',
            raised: '5600081380992970020',
        },
        contract: communitiesContract.get(communityIds[4])!,
        started: new Date(nowTimestamp - 1296000000), // 15×24×60×60×1000
    },
];

// TODO: fix type
export const validEmptyCommunities: any[] = [
    {
        publicId: communityIds[5],
        contractAddress: '0x473a3be7C2A42452Ed0b521614B3b76BC59D2D1D',
        state: {
            claimed: '0',
            raised: '1000000000000000000',
        },
        contract: communitiesContract.get(communityIds[5])!,
        started: new Date(nowTimestamp - 518400000), // 6×24×60×60×1000
    },
];

export const communityAddressesAndIds = new Map(
    validNonEmptyMonthLongCommunities
        .concat(validNonEmptyLessThanMonthLongCommunities)
        .concat(validEmptyCommunities)
        .map((c) => [c.contractAddress, c.publicId])
);
