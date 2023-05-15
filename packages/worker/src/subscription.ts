import {
    database,
    config,
    interfaces,
    subgraph,
    utils,
} from '@impactmarket/core';
import { execute } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { ethers } from 'ethers';
import gql from 'graphql-tag';
import { Op } from 'sequelize';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import ws from 'ws';

const getWsClient = function (wsurl) {
    const client = new SubscriptionClient(wsurl, { reconnect: true }, ws);
    return client;
};

const createSubscriptionObservable = (wsurl, query, variables) => {
    const link = new WebSocketLink(getWsClient(wsurl));
    return execute(link, { query, variables });
};

export const communitySubscription = async () => {
    try {
        const COMMUNITY_QUERY = gql`
            subscription {
                communityEntities(
                    orderBy: startDayId
                    orderDirection: desc
                    where: {
                      startDayId_gte: ${
                          (new Date().getTime() / 1000 / 86400) | 0
                      }
                    }
                  ) {
                    id
                    startDayId
                  }
            }
        `;

        const subscriptionClient = createSubscriptionObservable(
            config.subgraphUrl, // GraphQL endpoint
            COMMUNITY_QUERY, // Subscription query
            {} // Query variables
        );
        subscriptionClient.subscribe(
            async (eventData) => {
                utils.Logger.info(
                    `Received event: ${JSON.stringify(eventData, null, 2)}`
                );
                const communityEntities: [
                    {
                        id: string;
                        startDayId: number;
                    }
                ] = eventData.data?.communityEntities;
                if (communityEntities && communityEntities.length > 0) {
                    communityEntities.forEach(async (communityEntitiy) => {
                        const today = (new Date().getTime() / 1000 / 86400) | 0;

                        if (
                            communityEntitiy.startDayId === today &&
                            !!communityEntitiy.id
                        ) {
                            try {
                                const community =
                                    await database.models.community.findOne({
                                        attributes: ['id', 'ambassadorAddress'],
                                        where: {
                                            contractAddress:
                                                ethers.utils.getAddress(
                                                    communityEntitiy.id
                                                ),
                                        },
                                    });

                                if (community && community.ambassadorAddress) {
                                    const notification =
                                        await database.models.appNotification.findOne(
                                            {
                                                where: {
                                                    type: interfaces.app
                                                        .appNotification
                                                        .NotificationType
                                                        .COMMUNITY_CREATED,
                                                    params: {
                                                        communityId:
                                                            community.id,
                                                    },
                                                },
                                            }
                                        );

                                    if (!notification) {
                                        const user =
                                            await database.models.appUser.findOne(
                                                {
                                                    attributes: ['id'],
                                                    where: {
                                                        address:
                                                            community.ambassadorAddress,
                                                    },
                                                }
                                            );

                                        await database.models.appNotification.create(
                                            {
                                                type: interfaces.app
                                                    .appNotification
                                                    .NotificationType
                                                    .COMMUNITY_CREATED,
                                                userId: user!.id,
                                                params: {
                                                    communityId: community.id,
                                                },
                                            }
                                        );
                                    }
                                }
                            } catch (error) {
                                utils.Logger.error(
                                    'Add notification error: ',
                                    error
                                );
                            }
                        }
                    });
                }
            },
            (err) => {
                utils.Logger.error('Subscribe Error: ', err);
            }
        );
    } catch (error) {
        utils.Logger.error('Error: ', error);
    }
};

export const userActivitySubscription = async () => {
    try {
        const USER_ACTIVITY_QUERY = gql`
            subscription {
                userActivityEntities(
                    orderBy: timestamp
                    orderDirection: desc
                    where:{
                        activity: ADDED
                        timestamp_gt: ${(new Date().getTime() / 1000) | 0}
                    }
                ) {
                    user
                    community {
                        id
                    }
                    timestamp
                }
            }
        `;

        const subscriptionClient = createSubscriptionObservable(
            config.subgraphUrl, // GraphQL endpoint
            USER_ACTIVITY_QUERY, // Subscription query
            {} // Query variables
        );
        subscriptionClient.subscribe(
            async (eventData) => {
                utils.Logger.info(
                    `Received event: ${JSON.stringify(eventData, null, 2)}`
                );
                const userActivityEntities: [
                    {
                        user: string;
                        community: {
                            id: string;
                        };
                        timestamp: number;
                    }
                ] = eventData.data?.userActivityEntities;

                if (userActivityEntities && userActivityEntities.length > 0) {
                    userActivityEntities.forEach(async (userActivity) => {
                        const date = new Date();
                        date.setMinutes(date.getMinutes() - 2);

                        if (
                            userActivity.timestamp * 1000 > date.getTime() &&
                            !!userActivity.user
                        ) {
                            try {
                                const user =
                                    await database.models.appUser.findOne({
                                        attributes: ['id'],
                                        where: {
                                            address: ethers.utils.getAddress(
                                                userActivity.user
                                            ),
                                        },
                                    });

                                const userRole = await getUserRoles(
                                    userActivity.user,
                                    userActivity.timestamp
                                );
                                if (user && userRole) {
                                    const { gte } = Op;
                                    const notification =
                                        await database.models.appNotification.findOne(
                                            {
                                                where: {
                                                    userId: user.id,
                                                    type: userRole,
                                                    createdAt: {
                                                        [gte]: new Date(
                                                            userActivity.timestamp *
                                                                1000
                                                        ),
                                                    },
                                                },
                                            }
                                        );
                                    if (!notification) {
                                        const community =
                                            await database.models.community.findOne(
                                                {
                                                    attributes: ['id'],
                                                    where: {
                                                        contractAddress:
                                                            ethers.utils.getAddress(
                                                                userActivity
                                                                    .community
                                                                    .id
                                                            ),
                                                    },
                                                }
                                            );
                                        await database.models.appNotification.create(
                                            {
                                                type: userRole,
                                                userId: user.id,
                                                params: {
                                                    communityId: community!.id,
                                                },
                                            }
                                        );
                                    }
                                }
                            } catch (error) {
                                utils.Logger.error(
                                    'Add notification error: ',
                                    error
                                );
                            }
                        }
                    });
                }
            },
            (err) => {
                utils.Logger.error('Subscribe error: ', err);
            }
        );
    } catch (error) {
        utils.Logger.error('Error: ', error);
    }
};

const getUserRoles = async (address: string, timestamp: number) => {
    const ENTITIES_QUERY = {
        operationName: 'getUserRoles',
        query: `query getUserRoles {
            managerEntities(
                where: {
                    address: "${address}"
                    since: ${timestamp}
                }
            ){
                id
                state
                address
                since
            }
            beneficiaryEntities(
                where: {
                    address: "${address}"
                    since: ${timestamp}
                }
            ){
                id
                state
                address
                since
            }
        }`,
    };

    const queryDAOResult = await subgraph.config.axiosSubgraph.post<
        any,
        {
            data: {
                data: {
                    beneficiaryEntities: {
                        id: string,
                        state: number,
                        address: string,
                        since: number,
                    }[],
                    managerEntities: {
                        id: string,
                        state: number,
                        address: string,
                        since: number,
                    }[]
                };
            };
        }
    >('', ENTITIES_QUERY);

    const response = queryDAOResult.data?.data;

    if (
        response.beneficiaryEntities &&
        response.beneficiaryEntities.length > 0
    ) {
        return interfaces.app.appNotification.NotificationType
            .BENEFICIARY_ADDED;
    } else if (
        response.managerEntities &&
        response.managerEntities.length > 0
    ) {
        return interfaces.app.appNotification.NotificationType.MANAGER_ADDED;
    } else {
        return null;
    }
};
