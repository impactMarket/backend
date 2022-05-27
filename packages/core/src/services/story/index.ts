import { NotificationType } from '../../interfaces/app/appNotification';
import { col, fn, Op } from 'sequelize';

import config from '../../config';
import { models } from '../../database';
import { StoryContentModel } from '../../database/models/story/storyContent';
import { StoryCommunityCreationEager } from '../../interfaces/story/storyCommunity';
import { StoryContent } from '../../interfaces/story/storyContent';
import { BaseError } from '../../utils/baseError';
import {
    IAddStory,
    ICommunitiesListStories,
    ICommunityStories,
    ICommunityStory,
} from '../endpoints';
import { StoryContentStorage } from '../storage';
import { getUserRoles } from '../../subgraph/queries/user';
import { ethers } from 'ethers';

export default class StoryServiceV2 {
    private storyContentStorage = new StoryContentStorage();

    public getPresignedUrlMedia(mime: string) {
        return this.storyContentStorage.getPresignedUrlPutObject(mime);
    }

    public async add(
        fromAddress: string,
        story: IAddStory
    ): Promise<ICommunityStory> {
        let storyContentToAdd: {
            storyMediaPath?: string;
            message?: string;
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

        const communityAddress = userRole.beneficiary ? userRole.beneficiary.community : userRole.manager!.community;

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

    public async getById(storyId: number, userAddress?: string): Promise<StoryContent> {
        const story = await models.storyContent.findOne({
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
                            ]
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
            ],
            where: {
                id: storyId,
            }
        });

        if (!story) {
            throw new BaseError('STORY_NOT_FOUND', 'story not found');
        }

        return story as StoryContent;
    }

    public async listByUser(
        onlyFromAddress: string,
        query: { offset?: string; limit?: string }
    ): Promise<{ count: number; content: ICommunityStories }> {
        const r = await models.storyContent.findAndCountAll({
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
            ],
            where: { byAddress: onlyFromAddress, isPublic: true },
            order: [['postedAt', 'DESC']],
            offset: query.offset
                ? parseInt(query.offset, 10)
                : config.defaultOffset,
            limit: query.limit
                ? parseInt(query.limit, 10)
                : config.defaultLimit,
        });
        const communitiesStories = r.rows.map((c) => {
            const content = c.toJSON() as StoryContent;
            return {
                id: content.id,
                storyMediaPath: content.storyMediaPath,
                message: content.message,
                isDeletable: content.byAddress.toLowerCase() ===
                    onlyFromAddress.toLowerCase(),
                createdAt: content.postedAt,
                community: content.storyCommunity!.community,
                engagement: {
                    loves: content.storyEngagement?.loves || 0,
                    userReported: !!content.storyUserReport?.length,
                    userLoved: !!content.storyUserEngagement?.length,
                },
            };
        });
        return {
            count: r.count,
            content: communitiesStories as any,
        };
    }

    public async list(
        query: {
            offset?: string;
            limit?: string;
            communityId?: string[] | string;
            country?: string[] | string;
        },
        userAddress?: string
    ): Promise<{ count: number; content: ICommunitiesListStories[] }> {
        let r: {
            rows: StoryContentModel[];
            count: number;
        };
        try {
            r = await models.storyContent.findAndCountAll({
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
                ],
                where: {
                    isPublic: true,
                    ...(userAddress ? { '$"storyUserReport"."contentId"$': null } : {})
                } as any,
                order: [['postedAt', 'DESC']],
                offset: query.offset
                    ? parseInt(query.offset, 10)
                    : config.defaultOffset,
                limit: query.limit
                    ? parseInt(query.limit, 10)
                    : config.defaultLimit,
            });
        } catch (e) {
            return {
                count: 0,
                content: [],
            };
        }
        const communitiesStories = r.rows.map((c) => {
            const content = c.toJSON() as StoryContent;
            return {
                // we can use ! because it's included on the query
                id: content.id,
                storyMediaPath: content.storyMediaPath,
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
                },
            };
        });
        return {
            count: r.count,
            content: communitiesStories as any,
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
            
            await models.storyUserEngagement.create({
                contentId,
                address: userAddress,
            });
        }
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
            include: [{
                attributes: [],
                model: models.community,
                as: 'community'
            }],
            group: [groupName],
            raw: true,
        })) as any;

        return result;
    }

    public async deleteOlderStories() {
        // TODO: update
        // const tenDaysAgo = new Date();
        // tenDaysAgo.setDate(tenDaysAgo.getDate() - 30);
        // //
        // const mostRecentStoryByCommunity = await models.storyContent.findAll({
        //     attributes: ['id'],
        //     include: [
        //         {
        //             model: this.storyCommunity,
        //             as: 'storyCommunity',
        //             attributes: [],
        //         },
        //     ],
        //     where: {
        //         postedAt: {
        //             // TODO: use query builder instead
        //             [Op.eq]: literal(
        //                 `(select max("postedAt") from story_content sc, story_community sm where sc.id=sm."contentId" and sm."communityId"="storyCommunity"."communityId" and sc."isPublic"=true)`
        //             ),
        //         } as { [Op.eq]: Literal },
        //     },
        //     order: [['postedAt', 'DESC']],
        // });
        // if (mostRecentStoryByCommunity.length === 0) {
        //     return;
        // }
        // const storiesToDelete = await models.storyContent.findAll({
        //     attributes: ['id', 'mediaMediaId'],
        //     where: {
        //         postedAt: {
        //             [Op.lte]: tenDaysAgo,
        //         },
        //         id: {
        //             [Op.notIn]: mostRecentStoryByCommunity.map((sbc) => sbc.id),
        //         },
        //     },
        // });
        // if (storiesToDelete.length === 0) {
        //     return;
        // }
        // await models.storyContent.destroy({
        //     where: {
        //         id: {
        //             [Op.in]: storiesToDelete.map((s) => s.id),
        //         },
        //     },
        // });
        // await this.storyContentStorage.deleteBulkContent(
        //     storiesToDelete
        //         .filter((s) => s.mediaMediaId !== null)
        //         .map((s) => s.mediaMediaId!) // not null here
        // );
    }

    private async addNotification(userAddress: string, contentId: number) {
        const story = (await models.storyContent.findOne({
            attributes: [],
            where: { id: contentId },
            include: [{
                model: models.appUser,
                as: 'user',
                attributes: ['id']
            }]
        }))! as StoryContent;

        await models.appNotification.findOrCreate({
            where: {
                userId: story.user!.id,
                type: NotificationType.STORY_LIKED,
                params: { userAddress, contentId }
            }
        });
    }
}
