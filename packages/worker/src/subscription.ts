import { database, config, interfaces, subgraph, utils } from '@impactmarket/core';
import ethers from 'ethers';
import { execute } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import ws from 'ws';
import gql from 'graphql-tag';

const getWsClient = function(wsurl) {
    const client = new SubscriptionClient(
      wsurl, {reconnect: true}, ws
    );
    return client;
};

const createSubscriptionObservable = (wsurl, query, variables) => {
    const link = new WebSocketLink(getWsClient(wsurl));
    return execute(link, {query: query, variables: variables});
};

export const communitySubscription = async () => {
    try {
        const COMMUNITY_QUERY = gql`
            subscription {
                communityEntities(
                    first: 1
                    orderBy: startDayId
                    orderDirection: desc
                    where: {
                      startDayId_gt: ${(new Date().getTime() / 1000) / 86400 | 0}
                    }
                  ) {
                    id
                  }
            }
        `;

        const subscriptionClient = createSubscriptionObservable(
            config.subgraphUrl, // GraphQL endpoint
            COMMUNITY_QUERY, // Subscription query
            {} // Query variables
          );
        subscriptionClient.subscribe(async eventData => {
            // Do something on receipt of the event
            utils.Logger.info(`Received event: ${JSON.stringify(eventData, null, 2)}`);
            const communityEntitiy = eventData.data?.communityEntities[0];
    
            if (communityEntitiy && communityEntitiy.id) {
                const community = await database.models.community.findOne({
                    attributes: ['ambassadorAddress'],
                    where: {
                        contractAddress: ethers.utils.getAddress(communityEntitiy.id),
                    }
                });

                if (community && community.ambassadorAddress) {
                    const user = await database.models.appUser.findOne({
                        attributes: ['id'],
                        where: {
                            address: community.ambassadorAddress
                        }
                    });
                    await database.models.appNotification.create({
                        type: interfaces.app.appNotification.NotificationType.COMMUNITY_CREATED,
                        userId: user!.id,
                        params: {},
                    })
                }
            }
        }, (err) => {
            utils.Logger.error('Error: ', err);
        });
    } catch (error) {
        utils.Logger.error('Error: ', error);
    }
}

export const userActivitySubscription = async () => {
    try {
        const USER_ACTIVITY_QUERY = gql`
            subscription {
                userActivityEntities(
                    first: 1
                    orderBy: timestamp
                    orderDirection: desc
                    where:{
                        activity: ADDED
                        timestamp_gt: ${new Date().getTime() / 1000 | 0}
                    }
                ) {
                    user
                    activity
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
        subscriptionClient.subscribe(async eventData => {
            // Do something on receipt of the event
            utils.Logger.info(`Received event: ${JSON.stringify(eventData, null, 2)}`);
            const userActivity = eventData.data?.userActivityEntities[0];
    
            if (userActivity && userActivity.user) {
                const user = await database.models.appUser.findOne({
                    attributes: ['id'],
                    where: {
                        address: ethers.utils.getAddress(userActivity.user),
                    }
                });

                const userRole = await getUserRoles(userActivity.user, userActivity.timestamp);
                if (user && userRole) {
                    await database.models.appNotification.create({
                        type: userRole,
                        userId: user.id,
                        params: {},
                    })
                }
            }
        }, (err) => {
            utils.Logger.error('Error: ', err);
        });
    } catch (error) {
        utils.Logger.error('Error: ', error);
    }
}

const getUserRoles = async (address: string, timestamp: number) => {
    const ENTITIES_QUERY = gql`
        {
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
        }
    `;

    const queryDAOResult = await subgraph.config.clientDAO.query({
        query: ENTITIES_QUERY,
        fetchPolicy: 'no-cache',
    });

    if (queryDAOResult.data?.beneficiaryEntities && queryDAOResult.data.beneficiaryEntities.length > 0) {
        return interfaces.app.appNotification.NotificationType.BENEFICIARY_ADDED
    } else if (queryDAOResult.data.managerEntities && queryDAOResult.data.managerEntities.length > 0) {
        return interfaces.app.appNotification.NotificationType.MANAGER_ADDED
    } else {
        return null
    }
}

