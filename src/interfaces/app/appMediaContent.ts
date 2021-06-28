import { AppMediaThumbnail } from './appMediaThumbnail';

/**
 * @swagger
 *  components:
 *    schemas:
 *      AppMediaContent:
 *        type: object
 *        required:
 *          - id
 *          - url
 *          - width
 *          - height
 *          - thumbnails
 *        properties:
 *          id:
 *            type: integer
 *            description: Media id
 *          url:
 *            type: string
 *            description: Media URL
 *          width:
 *            type: integer
 *            description: Media width
 *          height:
 *            type: integer
 *            description: Media height
 *          thumbnails:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/AppMediaThumbnail'
 */
export interface AppMediaContent {
    id: number;
    url: string;
    width: number;
    height: number;

    thumbnails?: AppMediaThumbnail[];
}
export interface AppMediaContentCreation {
    url: string;
    width: number;
    height: number;
}
