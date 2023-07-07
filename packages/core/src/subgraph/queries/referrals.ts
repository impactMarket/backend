import { axiosSubgraph } from '../config';
import { intervalsInSeconds } from '../../types';
import { redisClient } from '../../database';

type UserCampaign = {
    campaignId: string;
    usages: number;
    endTime: number;
    rewardAmount: string;
    maxReferralLinks: number;
};

export const getReferralCampaigns = async (): Promise<
    { id: string; endTime: number; rewardAmount: string; maxReferralLinks: number }[]
> => {
    try {
        const graphqlQuery = {
            operationName: 'referralCampaigns',
            query: `query referralCampaigns {
                referralCampaigns {
                    id
                    endTime
                    rewardAmount
                    maxReferralLinks
                }
            }`
        };
        const cacheResults = await redisClient.get(graphqlQuery.query);

        if (cacheResults) {
            return JSON.parse(cacheResults);
        }
        const response = await axiosSubgraph.post<
            any,
            {
                data: {
                    data: {
                        referralCampaigns: {
                            id: string;
                            endTime: number;
                            rewardAmount: string;
                            maxReferralLinks: number;
                        }[];
                    };
                };
            }
        >('', graphqlQuery);

        redisClient.set(
            graphqlQuery.query,
            JSON.stringify(response.data?.data.referralCampaigns),
            'EX',
            intervalsInSeconds.oneHour
        );
        return response.data?.data.referralCampaigns;
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const getReferralCampaignAndUsages = async (address: string): Promise<UserCampaign[]> => {
    try {
        const campaigns = await getReferralCampaigns();

        const graphqlQuery = {
            operationName: 'userReferrals',
            query: `query userReferrals {
                userReferrals(
                    where: {
                        user: "${address.toLowerCase()}"
                    }
                ) {
                    usages
                    campaign {
                        id
                    }
                }
            }`
        };
        const response = await axiosSubgraph.post<
            any,
            {
                data: {
                    data: {
                        userReferrals: { usages: number; campaign: { id: string } }[];
                    };
                };
            }
        >('', graphqlQuery);

        const userCampaigns: UserCampaign[] = [];

        console.log(response.data);

        for (const campaign of campaigns) {
            const userCampaign: UserCampaign = { ...campaign, campaignId: campaign.id, usages: 0 };
            delete userCampaign['id'];
            const campaignUsages = response.data?.data.userReferrals.find(
                userCampaign => userCampaign.campaign.id === campaign.id
            );

            if (campaignUsages) {
                userCampaign.usages = campaignUsages.usages;
            }
            userCampaigns.push(userCampaign);
        }

        return userCampaigns;
    } catch (error) {
        console.error(error);
        return [];
    }
};
