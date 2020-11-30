import { communityIds, nowTimestamp } from "./community";


export const activeBeneficiariesLast30Days = new Map<string, number>();
activeBeneficiariesLast30Days.set(communityIds[0], 71);
activeBeneficiariesLast30Days.set(communityIds[1], 16);
activeBeneficiariesLast30Days.set(communityIds[2], 142);

// TODO: fix type
export const allBeneficiariesInCommunity: any[][] = [
    [
        {
            claims: 6,
            lastClaimAt: new Date(nowTimestamp),
            penultimateClaimAt: new Date(nowTimestamp - (86400 + 600 * 4 + 3094) * 1000),
        },
        {
            claims: 2,
            lastClaimAt: new Date(nowTimestamp),
            penultimateClaimAt: new Date(nowTimestamp - 87932 * 1000),
        },
        {
            claims: 9,
            lastClaimAt: new Date(nowTimestamp),
            penultimateClaimAt: new Date(nowTimestamp - (86400 + 600 * 7 + 9128) * 1000),
        },
    ],
    [
        {
            claims: 6,
            lastClaimAt: new Date(nowTimestamp),
            penultimateClaimAt: new Date(nowTimestamp - (86400 + 600 * 4 + 3094) * 1000),
        },
        {
            claims: 2,
            lastClaimAt: new Date(nowTimestamp),
            penultimateClaimAt: new Date(nowTimestamp - 87932 * 1000),
        },
        {
            claims: 9,
            lastClaimAt: new Date(nowTimestamp),
            penultimateClaimAt: new Date(nowTimestamp - (86400 + 600 * 7 + 9128) * 1000),
        },
    ],
    [
        {
            claims: 6,
            lastClaimAt: new Date(nowTimestamp),
            penultimateClaimAt: new Date(nowTimestamp - (86400 + 600 * 4 + 3094) * 1000),
        },
        {
            claims: 2,
            lastClaimAt: new Date(nowTimestamp),
            penultimateClaimAt: new Date(nowTimestamp - 87932 * 1000),
        },
        {
            claims: 9,
            lastClaimAt: new Date(nowTimestamp),
            penultimateClaimAt: new Date(nowTimestamp - (86400 + 600 * 7 + 9128) * 1000),
        },
    ],
];