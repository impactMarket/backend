/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiCommunityState:
 *        type: object
 *        required:
 *          - communityId
 *          - claimed
 *          - claims
 *          - beneficiaries
 *          - removedBeneficiaries
 *          - managers
 *          - raised
 *          - backers
 *        properties:
 *          communityId:
 *            type: integer
 *            description: The community id
 *          claimed:
 *            type: string
 *            description: Claimed amount since contract inception (with 18 decimals)
 *          claims:
 *            type: integer
 *            description: Number of claims since contract inception
 *          beneficiaries:
 *            type: integer
 *            description: Number of currently active beneficiaries
 *          removedBeneficiaries:
 *            type: integer
 *            description: Number of currently removed beneficiaries
 *          managers:
 *            type: integer
 *            description: Number of current active managers
 *          raised:
 *            type: string
 *            description: Raised amount since contract inception (with 18 decimals)
 *          backers:
 *            type: integer
 *            description: Number of unique backers since contract inception
 */
export interface UbiCommunityState {
    communityId: number;
    claimed: string;
    claims: number;
    beneficiaries: number; // only in community
    removedBeneficiaries: number;
    managers: number;
    raised: string;
    backers: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface UbiCommunityStateCreation {
    communityId: number;
}
