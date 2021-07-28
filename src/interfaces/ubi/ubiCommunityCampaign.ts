/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiCommunityCampaign:
 *        type: object
 *        required:
 *          - communityId
 *          - campaignUrl
 *        properties:
 *          communityId:
 *            type: integer
 *            description: The community id
 *          campaignUrl:
 *            type: string
 *            description: esolidar campaign URL
 */
 export interface UbiCommunityCampaign {
    id: number;
    communityId: number;
    campaignUrl: string;
}

export interface UbiCommunityCampaignCreation {
    communityId: number;
    campaignUrl: string;
}

