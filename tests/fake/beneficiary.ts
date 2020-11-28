import { communityIds } from "./community";


export const activeBeneficiariesLast30Days = new Map<string, number>();
activeBeneficiariesLast30Days.set(communityIds[0], 71);
activeBeneficiariesLast30Days.set(communityIds[1], 16);
activeBeneficiariesLast30Days.set(communityIds[2], 142);

// TODO: fix type
export const allBeneficiariesInCommunity: any[] = [
    {
        claims: 6,
        lastClaimAt: new Date(),
        penultimateClaimAt: new Date(),
    },
    {
        claims: 2,
        lastClaimAt: new Date(),
        penultimateClaimAt: new Date(),
    },
    {
        claims: 9,
        lastClaimAt: new Date(),
        penultimateClaimAt: new Date(),
    },
];