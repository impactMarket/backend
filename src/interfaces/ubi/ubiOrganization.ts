import { AppMediaContent } from '@interfaces/app/appMediaContent';

import { UbiOrganizationSocialMedia } from './ubiOrganizationSocialMedia';

export interface UbiOrganization {
    id: number;
    name: string;
    description: string;
    logoMediaId: number;

    logo?: AppMediaContent;
    socialMedia?: UbiOrganizationSocialMedia[];
}

export interface UbiOrganizationCreation {
    name: string;
    description: string;
    logoMediaId: number;
}
