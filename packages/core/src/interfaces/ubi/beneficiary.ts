import { AppUser } from '../app/appUser';
import { CommunityAttributes } from './community';

/**
 * @swagger
 *  components:
 *    schemas:
 *      Beneficiary:
 *        type: object
 *        required:
 *          - id
 *          - address
 *          - communityId
 *          - active
 *          - blocked
 *          - tx
 *          - txAt
 *          - claims
 *          - claimed
 *          - lastClaimAt
 *          - penultimateClaimAt
 *          - readRules
 *          - createdAt
 *          - updatedAt
 *          - user
 *          - community
 *        properties:
 *          id:
 *            type: integer
 *          address:
 *            type: string
 *          communityId:
 *            type: integer
 *          active:
 *            type: boolean
 *          blocked:
 *            type: boolean
 *          tx:
 *            type: string
 *          txAt:
 *            type: string
 *          claims:
 *            type: integer
 *          claimed:
 *            type: string
 *          lastClaimAt:
 *            type: string
 *          penultimateClaimAt:
 *            type: string
 *          readRules:
 *            type: boolean
 *          user:
 *            $ref: '#/components/schemas/AppUser'
 *          community:
 *            $ref: '#/components/schemas/Community'
 *          createdAt:
 *            type: string
 *          updatedAt:
 *            type: string
 */

export interface BeneficiaryAttributes {
    id: number;
    address: string;
    communityId: number;
    active: boolean;
    blocked: boolean;
    tx: string;
    txAt: Date;
    claims: number;
    claimed: string;
    lastClaimAt: Date | null;
    penultimateClaimAt: Date | null;
    readRules: boolean;

    // timestamps
    createdAt: Date;
    updatedAt: Date;

    user?: AppUser;
    community?: CommunityAttributes;
}
export interface BeneficiaryCreationAttributes {
    address: string;
    communityId: number;
    tx: string;
    txAt: Date;
}

export interface BeneficiarySubgraph {
    claims: number;
    community: {
        id: string;
    };
    lastClaimAt: number;
    preLastClaimAt: number;
}
