/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiCommunityDailyMetrics:
 *        type: object
 *        required:
 *          - communityId
 *          - ssiDayAlone
 *          - ssi
 *          - ubiRate
 *          - estimatedDuration
 *          - date
 *        properties:
 *          communityId:
 *            type: integer
 *            description: The community id
 *          ssiDayAlone:
 *            type: integer
 *            description: SSI (without 5 days average)
 *          ssi:
 *            type: integer
 *            description: SSI (with 5 days average)
 *          ubiRate:
 *            type: integer
 *            description: UBI rate per beneficiary
 *          estimatedDuration:
 *            type: integer
 *            description: Estimated duration of the UBI program
 *          date:
 *            type: string
 *            format: date
 *            description: Date of which the daily metrics represents
 */
export interface UbiCommunityDailyMetrics {
    id: number;
    communityId: number;
    ssiDayAlone: number;
    ssi: number;
    ubiRate: number;
    estimatedDuration: number;
    date: Date;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}
export interface UbiCommunityDailyMetricsCreation {
    communityId: number;
    ssiDayAlone: number;
    ssi: number;
    ubiRate: number;
    estimatedDuration: number;
    date: Date;
}
