/**
 * @swagger
 *  components:
 *    schemas:
 *      AppMediaThumbnail:
 *        type: object
 *        required:
 *          - id
 *          - mediaContentId
 *          - url
 *          - width
 *          - height
 *          - pixelRatio
 *        properties:
 *          id:
 *            type: integer
 *            description: Thumbnail id
 *          mediaContentId:
 *            type: integer
 *            description: Thumbnail media content id
 *          url:
 *            type: string
 *            description: Thumbnail URL
 *          width:
 *            type: integer
 *            description: Thumbnail width
 *          height:
 *            type: integer
 *            description: Thumbnail height
 *          pixelRatio:
 *            type: integer
 *            description: Thumbnail pixel ratio
 */
export interface AppMediaThumbnail {
    id: number;
    mediaContentId: number;
    url: string;
    width: number;
    height: number;
    pixelRatio: number;
}
export interface AppMediaThumbnailCreation {
    mediaContentId: number;
    url: string;
    width: number;
    height: number;
    pixelRatio: number;
}
