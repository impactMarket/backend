import { getAddress } from 'ethers';
import { interfaces, config, database, subgraph } from '@impactmarket/core';
import { CommunityAttributes } from '@impactmarket/core/src/interfaces/ubi/community';
import BigNumber from 'bignumber.js';
import { Op } from 'sequelize';

export async function calcuateCommunitiesMetrics(): Promise<void> {
    const aMonthAgo = new Date();
    aMonthAgo.setDate(aMonthAgo.getDate() - 30);
    aMonthAgo.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // query communities data

    const whereCommunity = {
        [Op.or]: [
            {
                status: 'valid',
            },
            {
                [Op.and]: [
                    { status: 'removed' },
                    { deletedAt: { [Op.between]: [yesterday, today] } },
                ],
            },
        ],
    };

    const communitiesStatePre = await database.models.community.findAll({
        attributes: ['id', 'started', 'contractAddress'],
        where: {
            ...whereCommunity,
            visibility: 'public',
        },
        order: [['id', 'DESC']],
    });

    // build communities object
    const communitiesState = communitiesStatePre.map(
        (c) => c.toJSON() as interfaces.ubi.community.CommunityAttributes
    );

    const aMonthAgoId = (aMonthAgo.getTime() / 1000 / 86400) | 0;

    const calculateMetrics = async (communities: CommunityAttributes[]) => {
        const communityEntity =
            await subgraph.queries.community.getCommunityStateByAddresses(
                communities.map((el) => el.contractAddress!)
            );

        // community monthly
        const promises = communities.map(async (community) => {
            const dailyState =
                await subgraph.queries.community.getCommunityDailyState(
                    `dayId_gte: ${aMonthAgoId}, community: "${community.contractAddress!.toLowerCase()}"`
                );
            const allBeneficiaries =
                await subgraph.queries.beneficiary.getAllBeneficiaries(
                    community.contractAddress!
                );

            return {
                address: community.contractAddress,
                dailyState,
                allBeneficiaries,
            };
        });

        const result = await Promise.all(promises);
        const dailyMetricsPromises: Promise<any>[] = [];
        communities.forEach((community) => {
            const communityMonth = result.find(
                (el) => el.address === community.contractAddress
            );
            const communityContract = communityEntity.find(
                (el) => getAddress(el.id) === community.contractAddress
            );

            let ubiRate: number = 0;
            let estimatedDuration: number = 0;
            let daysSinceStart = Math.round(
                (new Date().getTime() - new Date(community.started).getTime()) /
                    86400000
            ); // 86400000 1 days in ms
            if (daysSinceStart > 30) {
                daysSinceStart = 30;
            }

            // calculate ubiRate
            const communityMonthReduced = communityMonth?.dailyState.reduce(
                (acc, el) => {
                    acc.claimed += el.claimed;
                    return acc;
                },
                { claimed: 0 }
            );
            ubiRate =
                communityMonthReduced?.claimed &&
                communityMonth?.allBeneficiaries.length
                    ? parseFloat(
                          new BigNumber(communityMonthReduced.claimed)
                              .dividedBy(communityMonth.allBeneficiaries.length)
                              .dividedBy(daysSinceStart)
                              .toFixed(4, 1)
                      )
                    : 0;

            // calculate estimatedDuration
            estimatedDuration =
                communityContract?.maxClaim && ubiRate
                    ? parseFloat(
                          new BigNumber(communityContract?.maxClaim)
                              .dividedBy(ubiRate)
                              .dividedBy(30)
                              .toFixed(4, 1)
                      )
                    : 0;
            dailyMetricsPromises.push(
                database.models.ubiCommunityDailyMetrics.create({
                    communityId: community.id,
                    ssiDayAlone: 0,
                    ssi: 0,
                    ubiRate,
                    estimatedDuration,
                    date: yesterday,
                })
            );
        });

        await Promise.all(dailyMetricsPromises);
    };

    const batch = config.cronJobBatchSize;
    // for each community
    for (let i = 0; ; i += batch) {
        await calculateMetrics(communitiesState.slice(i, i + batch));
        if (i + batch > communitiesState.length) {
            break;
        }
    }
}
