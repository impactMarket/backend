/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiCommunityContract:
 *        type: object
 *        required:
 *          - communityId
 *          - claimAmount
 *          - maxClaim
 *          - baseInterval
 *          - incrementInterval
 *        properties:
 *          communityId:
 *            type: integer
 *            description: The community id
 *          claimAmount:
 *            type: string
 *            description: Contract claim amount variable (includes 18 decimals)
 *          maxClaim:
 *            type: string
 *            description: Contract max claim amount variable (includes 18 decimals)
 *          baseInterval:
 *            type: integer
 *            description: Contract base interval variable (in seconds)
 *          incrementInterval:
 *            type: integer
 *            description: Contract increment interval variable (in seconds)
 */
export interface UbiCommunityContract {
    communityId: number;
    claimAmount: string;
    maxClaim: string;
    baseInterval: number;
    incrementInterval: number;
    blocked?: boolean;
    decreaseStep?: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface UbiCommunityContractCreation {
    communityId: number;
    claimAmount: string;
    maxClaim: string;
    baseInterval: number;
    incrementInterval: number;
    blocked?: boolean;
    decreaseStep?: number;
}
