export const nowTimestamp = new Date().getTime();

export const communityIds = [
    // more than 30 days, fully running
    'c77a15a7-2cef-4d1e-96db-afd0b91ab71d',
    'b090d41f-91c0-4f18-a809-633217590bbb',
    'a3b4ad6e-dc8e-4861-b5b2-c1973907c515',
    // // running for less that 30 days, fully running
    // 'ffb2fa59-78c6-4378-82a8-2a28f9056c3d',
    // 'ff629eac-1669-4b30-a9cd-793e62052d73',
    // 'fa12164c-3039-47e1-9005-aaad668215ee',
    // // no beneficiaries
    // '2c0f816e-3475-4d4a-847f-13fb141993f6',
    // // beneficiaries and no claims
    // 'e3d59aaa-bcde-420f-88c5-77d21367fd28',
];

export const totalClaimedLast30Days = new Map<string, string>();
totalClaimedLast30Days.set(communityIds[0], '2516000000000000000000');
totalClaimedLast30Days.set(communityIds[1], '148000000000000000000');
totalClaimedLast30Days.set(communityIds[2], '1903500000000000000000');

export const ssiLast4Days = new Map<string, number[]>();
ssiLast4Days.set(communityIds[0], [0.92, 0.87, 1.2, 1.5]);
ssiLast4Days.set(communityIds[1], [1.3, 2.5, 2.3, 2]);
ssiLast4Days.set(communityIds[2], [0.8, 0.9, 1.2, 1.3]);

// TODO: fix type
export const communitiesContract = new Map<string, any>();
communitiesContract.set(communityIds[0], {
    claimAmount: '2000000000000000000',
    maxClaim: '1500000000000000000000',
    baseInterval: 86400,
    incrementInterval: 600
});
communitiesContract.set(communityIds[1], {
    claimAmount: '1000000000000000000',
    maxClaim: '600000000000000000000',
    baseInterval: 86400,
    incrementInterval: 300
});
communitiesContract.set(communityIds[2], {
    claimAmount: '1500000000000000000',
    maxClaim: '300000000000000000000',
    baseInterval: 86400,
    incrementInterval: 900
});

// TODO: fix type
export const validNonEmptyMonthLongCommunities: any[] = [
    {
        publicId: 'c77a15a7-2cef-4d1e-96db-afd0b91ab71d',
        state: {
            claimed: '3946000000000000000000',
            raised: '4340003115106414976421',
        },
        contractParams: {
            baseInterval: 86400,
            incrementInterval: 600,
        },
        started: new Date(nowTimestamp - 4752000000), // 55×24×60×60×1000
    },
    {
        publicId: 'b090d41f-91c0-4f18-a809-633217590bbb',
        state: {
            claimed: '163000000000000000000',
            raised: '200000000000000000000',
        },
        contractParams: {
            baseInterval: 86400,
            incrementInterval: 300,
        },
        started: new Date(nowTimestamp - 3888000000), // 45×24×60×60×1000
    },
    {
        publicId: 'a3b4ad6e-dc8e-4861-b5b2-c1973907c515',
        state: {
            claimed: '2068500000000000000000',
            raised: '2780008138099262974802',
        },
        contractParams: {
            baseInterval: 86400,
            incrementInterval: 900,
        },
        started: new Date(nowTimestamp - 3542400000), // 41×24×60×60×1000
    },
];