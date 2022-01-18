/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiCommunityDailyState:
 *        type: object
 *        required:
 *          - id
 *          - communityId
 *          - gps
 *          - createdAt
 *        properties:
 *          id:
 *            type: integer
 *          communityId:
 *            type: string
 *          claimed:
 *            type: string
 *          claims:
 *            type: integer
 *          beneficiaries:
 *            type: integer
 *          raised:
 *            type: string
 *          backers:
 *            type: integer
 *          monthlyBackers:
 *            type: integer
 *          volume:
 *            type: string
 *          transactions:
 *            type: number
 *          reach:
 *            type: number
 *          reachOut:
 *            type: number
 *          fundingRate:
 *            type: number
 *          date:
 *            type: string
 */

export interface UbiCommunityDailyState {
    id: number;
    communityId: number;
    claimed: string;
    claims: number;
    beneficiaries: number;
    raised: string;
    backers: number;
    monthlyBackers: number;
    volume: string;
    transactions: number;
    reach: number;
    reachOut: number;
    fundingRate: number;
    date: Date;
}
export interface UbiCommunityDailyStateCreation {
    communityId: number;
    claimed: string;
    claims: number;
    beneficiaries: number;
    raised: string;
    backers: number;
    monthlyBackers: number;
    volume: string;
    transactions: number;
    reach: number;
    reachOut: number;
    fundingRate: number;
    date: Date;
}
