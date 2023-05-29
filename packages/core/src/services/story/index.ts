import { ethers } from 'ethers';
import { getAddress } from '@ethersproject/address';
import { col, fn, GroupedCountResultItem, Op, Order } from 'sequelize';

import { IAddStory, ICommunityStory, ICommunityStoryGet } from './types';
import config from '../../config';
import { models } from '../../database';
import { StoryContentModel } from '../../database/models/story/storyContent';
import { NotificationType } from '../../interfaces/app/appNotification';
import { StoryCommunityCreationEager } from '../../interfaces/story/storyCommunity';
import { StoryContent } from '../../interfaces/story/storyContent';
import { getUserRoles } from '../../subgraph/queries/user';
import { BaseError } from '../../utils/baseError';
import { cleanStoryCache } from '../../utils/cache';
import { StoryContentStorage } from '../storage';
import { sendNotification } from '../../utils/pushNotification';

export default class StoryServiceV2 {
    private storyContentStorage = new StoryContentStorage();

    public getPresignedUrlMedia(query: { mime?: string[] | string }) {
        if (!query.mime) {
            throw new BaseError('INVALID_QUERY', 'missing mime');
        }

        if (typeof query.mime === 'string') {
            return this.storyContentStorage.getPresignedUrlPutObject(
                query.mime as string
            );
        } else {
            const promises = (query.mime as string[]).map(async (el) =>
                this.storyContentStorage.getPresignedUrlPutObject(el)
            );
            return Promise.all(promises);
        }
    }

    public async add(
        fromAddress: string,
        story: IAddStory
    ): Promise<ICommunityStory> {
        let storyContentToAdd: {
            storyMediaPath?: string;
            message?: string;
            storyMedia?: string[];
        } = {};
        if (story.storyMediaPath) {
            storyContentToAdd = {
                storyMediaPath: story.storyMediaPath,
            };
        }
        let storyCommunityToAdd: {
            storyCommunity?: StoryCommunityCreationEager[];
        } = {};
        if (story.message !== undefined) {
            storyContentToAdd = {
                ...storyContentToAdd,
                message: story.message,
            };
        }
        const userRole = await getUserRoles(fromAddress);

        if (!userRole.beneficiary && !userRole.manager) {
            throw new BaseError(
                'INVALID_ROLE',
                'user not a manager/beneficiary'
            );
        }

        const communityAddress = userRole.beneficiary
            ? userRole.beneficiary.community
            : userRole.manager!.community;

        const community = await models.community.findOne({
            attributes: ['id'],
            where: {
                contractAddress: ethers.utils.getAddress(communityAddress),
                visibility: 'public',
            },
        });

        if (!community) {
            throw new BaseError(
                'PRIVATE_COMMUNITY',
                'story cannot be added in private communities'
            );
        }

        if (story.storyMediaPath) {
            storyContentToAdd.storyMedia = [story.storyMediaPath];
        } else if (story.storyMedia && story.storyMedia.length > 0) {
            storyContentToAdd.storyMedia = story.storyMedia;
            storyContentToAdd.storyMediaPath = story.storyMedia[0];
        }

        storyCommunityToAdd = {
            storyCommunity: [
                {
                    communityId: community.id,
                },
            ],
        };
        const created = await models.storyContent.create(
            {
                ...storyContentToAdd,
                ...storyCommunityToAdd,
                byAddress: fromAddress,
                isPublic: true,
                postedAt: new Date(),
                storyEngagement: [],
            },
            {
                include: [
                    { model: models.storyCommunity, as: 'storyCommunity' },
                    { model: models.storyEngagement, as: 'storyEngagement' },
                ],
            }
        );

        // if success, clean cache
        cleanStoryCache();

        const newStory = created.toJSON() as StoryContent;
        return { ...newStory, loves: 0, userLoved: false, userReported: false };
    }

    public async remove(storyId: number, userAddress: string): Promise<number> {
        const contentPath = await models.storyContent.findOne({
            where: { id: storyId },
        });
        if (contentPath === null) {
            return 0;
        }
        const result = await models.storyContent.destroy({
            where: { id: storyId, byAddress: userAddress },
        });
        if (contentPath.storyMediaPath) {
            // TODO: delete media
            // await this.storyContentStorage.deleteContent(
            //     contentPath.storyMediaPath
            // );
        }
        return result;
    }

    public async getById(
        storyId: number,
        userAddress?: string
    ): Promise<ICommunityStoryGet> {
        const story = await models.storyContent.findOne({
            subQuery: false,
            attributes: [
                'id',
                'message',
                'storyMedia',
                'byAddress',
                'postedAt',
                [
                    fn('count', fn('distinct', col('storyComment.id'))),
                    'totalComments',
                ],
            ],
            include: [
                {
                    model: models.storyCommunity,
                    as: 'storyCommunity',
                    required: true,
                    include: [
                        {
                            model: models.community,
                            as: 'community',
                            attributes: [
                                'id',
                                'name',
                                'coverMediaPath',
                                'city',
                                'country',
                            ],
                        },
                    ],
                },
                ...(userAddress
                    ? [
                          {
                              model: models.storyUserEngagement,
                              as: 'storyUserEngagement',
                              required: false,
                              duplicating: false,
                              where: {
                                  address: userAddress,
                              },
                          },
                          {
                              model: models.storyEngagement,
                              as: 'storyEngagement',
                          },
                          {
                              model: models.storyUserReport,
                              as: 'storyUserReport',
                              required: false,
                              duplicating: false,
                              where: {
                                  address: userAddress,
                              },
                          },
                      ]
                    : [
                          {
                              model: models.storyEngagement,
                              as: 'storyEngagement',
                          },
                      ]),
                {
                    attributes: [],
                    model: models.storyComment,
                    as: 'storyComment',
                    required: false,
                },
            ],
            where: {
                id: storyId,
            },
            group: [
                'storyContent.id',
                'storyCommunity.id',
                'storyCommunity->community.id',
                'storyEngagement.id',
                ...(userAddress
                    ? ['storyUserEngagement.id', 'storyUserReport.id']
                    : []),
            ],
        });

        if (!story) {
            throw new BaseError('STORY_NOT_FOUND', 'story not found');
        }

        const content = story.toJSON() as StoryContent & {
            totalComments: number;
        };
        return {
            // we can use ! because it's included on the query
            id: content.id,
            message: content.message,
            isDeletable: userAddress
                ? content.byAddress.toLowerCase() === userAddress.toLowerCase()
                : false,
            createdAt: content.postedAt,
            community: content.storyCommunity!.community,
            engagement: {
                loves: content.storyEngagement?.loves || 0,
                userLoved: !!content.storyUserEngagement?.length,
                userReported: content.storyUserReport
                    ? content.storyUserReport.length !== 0
                    : false,
                comments: content.totalComments,
            },
            storyMedia: content.storyMedia,
        };
    }

    public async listByUser(
        onlyFromAddress: string,
        query: { offset?: string; limit?: string }
    ): Promise<{ count: number; content: ICommunityStoryGet[] }> {
        const r = await models.storyContent.findAndCountAll({
            subQuery: false,
            attributes: [
                'id',
                'message',
                'storyMedia',
                'byAddress',
                'postedAt',
                [
                    fn('count', fn('distinct', col('storyComment.id'))),
                    'totalComments',
                ],
            ],
            include: [
                {
                    model: models.storyEngagement,
                    as: 'storyEngagement',
                    duplicating: false,
                },
                {
                    model: models.storyUserEngagement,
                    as: 'storyUserEngagement',
                    required: false,
                    duplicating: false,
                    where: {
                        address: onlyFromAddress,
                    },
                },
                {
                    model: models.storyUserReport,
                    as: 'storyUserReport',
                    required: false,
                    duplicating: false,
                    where: {
                        address: onlyFromAddress,
                    },
                },
                {
                    model: models.storyCommunity,
                    as: 'storyCommunity',
                    required: true,
                    include: [
                        {
                            model: models.community,
                            as: 'community',
                            attributes: [
                                'id',
                                'name',
                                'coverMediaPath',
                                'city',
                                'country',
                            ],
                        },
                    ],
                },
                {
                    attributes: [],
                    model: models.storyComment,
                    as: 'storyComment',
                    required: false,
                },
            ],
            where: { byAddress: onlyFromAddress, isPublic: true },
            order: [['postedAt', 'DESC']],
            offset: query.offset
                ? parseInt(query.offset, 10)
                : config.defaultOffset,
            limit: query.limit
                ? parseInt(query.limit, 10)
                : config.defaultLimit,
            group: [
                'StoryContentModel.id',
                'storyCommunity.id',
                'storyCommunity->community.id',
                'storyEngagement.id',
                'storyUserEngagement.id',
                'storyUserReport.id',
            ],
        });
        const communitiesStories = r.rows.map((c) => {
            const content = c.toJSON() as StoryContent & {
                totalComments: number;
            };
            return {
                id: content.id,
                message: content.message,
                isDeletable:
                    content.byAddress.toLowerCase() ===
                    onlyFromAddress.toLowerCase(),
                createdAt: content.postedAt,
                community: content.storyCommunity!.community,
                engagement: {
                    loves: content.storyEngagement?.loves || 0,
                    userReported: !!content.storyUserReport?.length,
                    userLoved: !!content.storyUserEngagement?.length,
                    comments: content.totalComments,
                },
                storyMedia: content.storyMedia,
            };
        });
        return {
            count: r.count.length,
            content: communitiesStories,
        };
    }

    public async list(
        query: {
            offset?: string;
            limit?: string;
            communityId?: string[] | string;
            country?: string[] | string;
            orderBy?: string;
            period?: string;
        },
        userAddress?: string
    ): Promise<{ count: number; content: ICommunityStoryGet[] }> {
        let r: {
            rows: StoryContentModel[];
            count: GroupedCountResultItem[];
        };
        try {
            let order: Order;
            if (query.orderBy) {
                const [orderBy, orderDirection] = query.orderBy.split(':');
                switch (orderBy) {
                    case 'mostLoved':
                        order = [
                            [
                                {
                                    model: models.storyEngagement,
                                    as: 'storyEngagement',
                                } as any,
                                'loves',
                                orderDirection,
                            ],
                        ];
                        break;
                    default:
                        order = [['postedAt', 'DESC']];
                        break;
                }
            } else {
                order = [['postedAt', 'DESC']];
            }

            let period: Date | null = null;
            if (query.period) {
                period = new Date();
                period.setDate(period.getDate() - parseInt(query.period, 10));
            }

            r = await models.storyContent.findAndCountAll({
                subQuery: false,
                attributes: [
                    'id',
                    'message',
                    'byAddress',
                    'storyMedia',
                    'postedAt',
                    [
                        fn('count', fn('distinct', col('storyComment.id'))),
                        'totalComments',
                    ],
                ],
                include: [
                    {
                        model: models.storyCommunity,
                        as: 'storyCommunity',
                        required: true,
                        include: [
                            {
                                model: models.community,
                                as: 'community',
                                attributes: [
                                    'id',
                                    'name',
                                    'coverMediaPath',
                                    'city',
                                    'country',
                                ],
                                ...(query.country
                                    ? {
                                          where: {
                                              country:
                                                  typeof query.country ===
                                                  'string'
                                                      ? query.country
                                                      : {
                                                            [Op.in]:
                                                                query.country,
                                                        },
                                          },
                                      }
                                    : {}),
                            },
                        ],
                        ...(query.communityId
                            ? {
                                  where: {
                                      communityId:
                                          typeof query.communityId === 'string'
                                              ? parseInt(query.communityId, 10)
                                              : {
                                                    [Op.in]:
                                                        query.communityId.map(
                                                            (c) =>
                                                                parseInt(c, 10)
                                                        ),
                                                },
                                  },
                              }
                            : {}),
                    },
                    ...(userAddress
                        ? [
                              {
                                  model: models.storyUserEngagement,
                                  as: 'storyUserEngagement',
                                  required: false,
                                  duplicating: false,
                                  where: {
                                      address: userAddress,
                                  },
                              },
                              {
                                  model: models.storyEngagement,
                                  as: 'storyEngagement',
                              },
                              {
                                  model: models.storyUserReport,
                                  as: 'storyUserReport',
                                  required: false,
                                  duplicating: false,
                                  where: {
                                      address: userAddress,
                                  },
                              },
                          ]
                        : [
                              {
                                  model: models.storyEngagement,
                                  as: 'storyEngagement',
                              },
                          ]),
                    {
                        attributes: [],
                        model: models.storyComment,
                        as: 'storyComment',
                        required: false,
                    },
                ],
                where: {
                    isPublic: true,
                    ...(userAddress
                        ? { '$"storyUserReport"."contentId"$': null }
                        : {}),
                    ...(period
                        ? {
                              postedAt: {
                                  [Op.gte]: period,
                              },
                          }
                        : {}),
                } as any,
                order,
                offset: query.offset
                    ? parseInt(query.offset, 10)
                    : config.defaultOffset,
                limit: query.limit
                    ? parseInt(query.limit, 10)
                    : config.defaultLimit,
                group: [
                    'storyContent.id',
                    'storyCommunity.id',
                    'storyCommunity->community.id',
                    'storyEngagement.id',
                    ...(userAddress
                        ? ['storyUserEngagement.id', 'storyUserReport.id']
                        : []),
                ],
            });
        } catch (e) {
            return {
                count: 0,
                content: [],
            };
        }
        const communitiesStories = r.rows.map((c) => {
            const content = c.toJSON() as StoryContent & {
                totalComments: number;
            };
            return {
                // we can use ! because it's included on the query
                id: content.id,
                message: content.message,
                isDeletable: userAddress
                    ? content.byAddress.toLowerCase() ===
                      userAddress.toLowerCase()
                    : false,
                createdAt: content.postedAt,
                community: content.storyCommunity!.community,
                engagement: {
                    loves: content.storyEngagement?.loves || 0,
                    userLoved: !!content.storyUserEngagement?.length,
                    comments: content.totalComments,
                },
                storyMedia: content.storyMedia,
            };
        });
        return {
            count: r.count.length,
            content: communitiesStories,
        };
    }

    public async love(userAddress: string, contentId: number) {
        const exists = await models.storyUserEngagement.findOne({
            where: {
                contentId,
                address: userAddress,
            },
        });
        if (exists) {
            await models.storyUserEngagement.destroy({
                where: { contentId, address: userAddress },
            });
        } else {
            this.addNotification(userAddress, contentId);
            const user = await models.appUser.findOne({
                attributes: ['id', 'language', 'walletPNT', 'appPNT'],
                where: {
                    address: getAddress(userAddress),
                },
            });

            if (user) {
                await sendNotification(
                    [user.toJSON()],
                    NotificationType.STORY_LIKED
                );
            }

            await models.storyUserEngagement.create({
                contentId,
                address: userAddress,
            });
        }

        // if success, clean cache
        cleanStoryCache();
    }

    public async inapropriate(
        userAddress: string,
        contentId: number,
        typeId?: number
    ) {
        const exists = await models.storyUserReport.findOne({
            where: {
                contentId,
                address: userAddress,
            },
        });
        if (exists) {
            await models.storyUserReport.destroy({
                where: { contentId, address: userAddress },
            });
        } else {
            await models.storyUserReport.create({
                contentId,
                typeId,
                address: userAddress,
            });
        }
    }

    public async count(groupBy: string): Promise<any[]> {
        let groupName = '';
        switch (groupBy) {
            case 'country':
                groupName = 'community.country';
                break;
        }

        if (groupName.length === 0) {
            throw new BaseError('INVALID_GROUP', 'invalid group');
        }

        const result = (await models.storyCommunity.findAll({
            attributes: [groupName, [fn('count', col(groupName)), 'count']],
            include: [
                {
                    attributes: [],
                    model: models.community,
                    as: 'community',
                },
            ],
            group: [groupName],
            raw: true,
        })) as any;

        return result;
    }

    public async addComment(
        userId: number,
        contentId: number,
        comment: string
    ) {
        try {
            await models.storyComment.create({
                contentId,
                comment,
                userId,
            });
            return true;
        } catch (error) {
            throw new BaseError('ERROR', 'comment was not added');
        }
    }

    public async getComments(
        contentId: number,
        query: { offset?: string; limit?: string }
    ) {
        try {
            const comments = await models.storyComment.findAndCountAll({
                include: [
                    {
                        attributes: [
                            'firstName',
                            'lastName',
                            'avatarMediaPath',
                        ],
                        model: models.appUser,
                        as: 'user',
                    },
                ],
                where: { contentId },
                order: [['createdAt', 'desc']],
                offset: query.offset
                    ? parseInt(query.offset, 10)
                    : config.defaultOffset,
                limit: query.limit
                    ? parseInt(query.limit, 10)
                    : config.defaultLimit,
            });
            return comments;
        } catch (error) {
            throw new BaseError('ERROR', 'error to get comments');
        }
    }

    public async removeComment(
        user: {
            userId: number;
            address: string;
        },
        contentId: number,
        commentId: number
    ) {
        try {
            const comment = await models.storyComment.findOne({
                where: { id: commentId },
            });

            if (!comment) {
                throw new BaseError('NOT_FOUND', 'comment not found');
            }

            if (comment.userId !== user.userId) {
                const story = await models.storyContent.findOne({
                    where: { id: contentId },
                });

                if (user.address !== story!.byAddress) {
                    throw new BaseError(
                        'NOT_ALLOWED',
                        'user is not the comment or story creator'
                    );
                }
            }

            await models.storyComment.destroy({
                where: {
                    id: commentId,
                    userId: user.userId,
                },
            });
            return true;
        } catch (error) {
            throw new BaseError('ERROR', 'comment was not deleted');
        }
    }

    private async addNotification(userAddress: string, contentId: number) {
        const story = (await models.storyContent.findOne({
            attributes: [],
            where: { id: contentId },
            include: [
                {
                    model: models.appUser,
                    as: 'user',
                    attributes: ['id'],
                },
            ],
        }))! as StoryContent;

        await models.appNotification.findOrCreate({
            where: {
                userId: story.user!.id,
                type: NotificationType.STORY_LIKED,
                params: { userAddress, contentId },
            },
        });
    }
}
