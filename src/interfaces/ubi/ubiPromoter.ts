import { AppMediaContent } from '@interfaces/app/appMediaContent';

import { UbiPromoterSocialMedia } from './ubiPromoterSocialMedia';

export interface UbiPromoter {
    id: number;
    name: string;
    description: string;
    logoMediaId: number;

    logo?: AppMediaContent;
    socialMedia?: UbiPromoterSocialMedia[];
}

export interface UbiPromoterCreation {
    name: string;
    description: string;
    logoMediaId: number;
}
