import { communityIds, now, nowTimestamp } from './community';

export const activeBeneficiariesLast30Days = new Map<string, number>();
activeBeneficiariesLast30Days.set(communityIds[0], 71);
activeBeneficiariesLast30Days.set(communityIds[1], 16);
activeBeneficiariesLast30Days.set(communityIds[2], 142);
activeBeneficiariesLast30Days.set(communityIds[3], 2);
activeBeneficiariesLast30Days.set(communityIds[4], 12);
activeBeneficiariesLast30Days.set(communityIds[5], 0);

// TODO: fix type
export const allBeneficiariesInCommunity: any[][] = [
    [
        {
            claims: 6,
            lastClaimAt: now,
            penultimateClaimAt: new Date(
                nowTimestamp - (86400 + 600 * 4 + 3094) * 1000
            ),
        },
        {
            claims: 2,
            lastClaimAt: now,
            penultimateClaimAt: new Date(nowTimestamp - 87932 * 1000),
        },
        {
            claims: 9,
            lastClaimAt: now,
            penultimateClaimAt: new Date(
                nowTimestamp - (86400 + 600 * 7 + 9128) * 1000
            ),
        },
    ],
    [
        {
            claims: 6,
            lastClaimAt: now,
            penultimateClaimAt: new Date(
                nowTimestamp - (86400 + 600 * 4 + 3094) * 1000
            ),
        },
        {
            claims: 2,
            lastClaimAt: now,
            penultimateClaimAt: new Date(nowTimestamp - 87932 * 1000),
        },
        {
            claims: 9,
            lastClaimAt: now,
            penultimateClaimAt: new Date(
                nowTimestamp - (86400 + 600 * 7 + 9128) * 1000
            ),
        },
        {
            claims: 1,
            lastClaimAt: now,
            penultimateClaimAt: null,
        },
    ],
    [
        {
            claims: 6,
            lastClaimAt: now,
            penultimateClaimAt: new Date(
                nowTimestamp - (86400 + 600 * 4 + 3094) * 1000
            ),
        },
        {
            claims: 2,
            lastClaimAt: now,
            penultimateClaimAt: new Date(nowTimestamp - 87932 * 1000),
        },
        {
            claims: 9,
            lastClaimAt: now,
            penultimateClaimAt: new Date(
                nowTimestamp - (86400 + 600 * 7 + 9128) * 1000
            ),
        },
        {
            claims: 0,
            lastClaimAt: null,
            penultimateClaimAt: null,
        },
    ],
    [
        {
            claims: 2,
            lastClaimAt: now,
            penultimateClaimAt: new Date(
                nowTimestamp - (86400 + 600 * 4 + 3094) * 1000
            ),
        },
        {
            claims: 2,
            lastClaimAt: now,
            penultimateClaimAt: new Date(nowTimestamp - 87932 * 1000),
        },
    ],
    [
        {
            claims: 4,
            lastClaimAt: now,
            penultimateClaimAt: new Date(
                nowTimestamp - (86400 + 600 * 4 + 3094) * 1000
            ),
        },
        {
            claims: 5,
            lastClaimAt: now,
            penultimateClaimAt: new Date(nowTimestamp - 87932 * 1000),
        },
        {
            claims: 3,
            lastClaimAt: now,
            penultimateClaimAt: new Date(
                nowTimestamp - (86400 + 600 * 7 + 9128) * 1000
            ),
        },
    ],
    [],
];
