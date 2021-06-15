/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiPromoterSocialMedia:
 *        type: object
 *        required:
 *          - promoterId
 *          - mediaType
 *          - url
 *        properties:
 *          promoterId:
 *            type: integer
 *            description: Promoter id
 *          mediaType:
 *            type: string
 *            description: Promoter media (usually social network name)
 *          url:
 *            type: string
 *            description: Promoter media URL
 */
export interface UbiPromoterSocialMedia {
    id: number;
    promoterId: number;
    mediaType: string;
    url: string;
}

export interface UbiPromoterSocialMediaCreation {
    promoterId: number;
    mediaType: string;
    url: string;
}
