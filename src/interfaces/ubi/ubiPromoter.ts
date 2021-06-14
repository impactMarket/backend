import { AppMediaContent } from '@interfaces/app/appMediaContent';

import { UbiPromoterSocialMedia } from './ubiPromoterSocialMedia';

export interface UbiPromoter {
    id: number;
    type: 'organization' | 'company' | 'individual';
    name: string;
    description: string;
    logoMediaId: number;

    logo?: AppMediaContent;
    socialMedia?: UbiPromoterSocialMedia[];
}

export interface UbiPromoterCreation {
    type: 'organization' | 'company' | 'individual';
    name: string;
    description: string;
    logoMediaId: number;
}
