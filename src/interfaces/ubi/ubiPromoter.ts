import { AppMediaContent } from '@interfaces/app/appMediaContent';

import { UbiPromoterSocialMedia } from './ubiPromoterSocialMedia';

/**
 * @swagger
 *  components:
 *    schemas:
 *      UbiPromoter:
 *        type: object
 *        required:
 *          - category
 *          - name
 *          - description
 *        properties:
 *          category:
 *            type: string
 *            enum: [organization, company, individual]
 *            description: Promoter category
 *          name:
 *            type: string
 *            description: Promoter name
 *          description:
 *            type: string
 *            description: Promoter description
 *          logo:
 *            $ref: '#/components/schemas/AppMediaContent'
 *          socialMedia:
 *            type: array
 *            items:
 *              $ref: '#/components/schemas/UbiPromoterSocialMedia'
 */
export interface UbiPromoter {
    id: number;
    category: 'organization' | 'company' | 'individual';
    name: string;
    description: string;
    logoMediaId: number;

    logo?: AppMediaContent;
    socialMedia?: UbiPromoterSocialMedia[];
}

export interface UbiPromoterCreation {
    category: 'organization' | 'company' | 'individual';
    name: string;
    description: string;
    logoMediaId: number;
}
