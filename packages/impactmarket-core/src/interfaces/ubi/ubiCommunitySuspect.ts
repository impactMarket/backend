/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiCommunitySuspect:
 *        type: object
 *        required:
 *          - communityId
 *          - percentage
 *          - suspect
 *          - createdAt
 *        properties:
 *          communityId:
 *            type: integer
 *            description: The community id
 *          percentage:
 *            type: number
 *            description: Percentage of beneficiaries with suspect activity
 *          suspect:
 *            type: number
 *            description: Suspect level (from 1 to 10), non-linear. 10 is more that 45% beneficiaries are suspect
 *          createdAt:
 *            type: string
 *            format: date-time
 *            description: Date of when the registry for suspect activity was created
 */
export interface UbiCommunitySuspect {
    id: number;
    communityId: number;
    percentage: number;
    suspect: number;
    createdAt: boolean;
}
export interface UbiCommunitySuspectCreation {
    communityId: number;
    percentage: number;
    suspect: number;
}
