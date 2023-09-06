import { ethers } from 'ethers';
import { getAddress } from '@ethersproject/address';

import { Op } from 'sequelize';
import { axiosSubgraph } from '../config';
import { models } from '../../database';
import config from '../../config';

export const getMonthlyDonationsByCommunity = async (): Promise<
    { name: string; donatedLastMonth: number; donatedPreviousMonth: number; donatedPriorMonth: number }[]
> => {
    // get all communities
    const graphqlQuery = {
        operationName: 'communityEntities',
        query: `query communityEntities { communityEntities { id } }`
    };

    const response = await axiosSubgraph.post('', graphqlQuery);
    console.log(response.data)
    const communityEntities = response.data?.data.communityEntities;

    // get current month
    const currentMonth = new Date().getMonth();
    // get dayid (timestamp/86400) for the first day of two months ago
    const dayIdTwoMonthsAgo = Math.floor(
        new Date(new Date().getFullYear(), currentMonth - 2, 1).getTime() / 1000 / 86400
    );

    // get daily donations (dayid) for each community for the last three months and sum them up by month
    const monthlyDonations: { community: string; monthlyDonations: { amount: number }[] }[] = await Promise.all(
        communityEntities.map(async (community: { id: string }) => {
            const graphqlQuery = {
                operationName: 'communityDailyEntities',
                query: `query communityDailyEntities($community: String!) {
                    communityDailyEntities(where:{ community:$community}) {
                      id
                      dayId
                      community {
                        id
                      }
                      contributed
                    }
                  }`,
                variables: {
                    community: community.id
                }
            };

            const response = await axiosSubgraph.post('', graphqlQuery);
            const communityDailyEntities = response.data?.data.communityDailyEntities;

            const monthlyDonations: { amount: number }[] = communityDailyEntities
                .filter((dailyDonation: { dayId: number }) => dailyDonation.dayId >= dayIdTwoMonthsAgo)
                .reduce((acc: { amount: number }[], dailyDonation: { dayId: number; contributed: number }) => {
                    const month = new Date(dailyDonation.dayId * 86400 * 1000).getMonth();
                    acc[month] = acc[month] || { amount: 0 };
                    acc[month].amount += dailyDonation.contributed;
                    return acc;
                }, []);

            return {
                community: community.id,
                monthlyDonations
            };
        })
    );

    // get community name from community database model
    const communitiesNamesQueried = await models.community.findAll({
        attributes: ['name', 'contractAddress'],
        where: {
            contractAddress: {
                [Op.in]: communityEntities.map((community: { id: string }) => getAddress(community.id))
            }
        }
    });
    const communitiesNames = communitiesNamesQueried.map(c => c.toJSON());
    console.log(communitiesNames);

    // combine monthly donations with community names
    const monthlyDonationsWithNames = monthlyDonations.map(monthlyDonation => {
        const communityName = communitiesNames.find(
            communityName => communityName.contractAddress?.toLowerCase() === monthlyDonation.community
        )?.name;

        console.log(communityName);

        return {
            monthlyDonations: monthlyDonation.monthlyDonations,
            communityName
        };
    });

    // get monthly donations for each community
    const monthlyDonationsByCommunity = monthlyDonationsWithNames.map(monthlyDonation => {
        const donatedLastMonth = monthlyDonation.monthlyDonations[0]?.amount || 0;
        const donatedPreviousMonth = monthlyDonation.monthlyDonations[1]?.amount || 0;
        const donatedPriorMonth = monthlyDonation.monthlyDonations[2]?.amount || 0;

        return {
            name: monthlyDonation.communityName!,
            donatedLastMonth,
            donatedPreviousMonth,
            donatedPriorMonth
        };
    });

    return monthlyDonationsByCommunity;
};
