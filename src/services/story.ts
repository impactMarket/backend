import { AppMediaContent } from '@interfaces/app/appMediaContent';
import {
    StoryCommunity,
    StoryCommunityCreationEager,
} from '@interfaces/story/storyCommunity';
import { StoryContent } from '@interfaces/story/storyContent';
import {
    IAddStory,
    ICommunitiesListStories,
    ICommunityStories,
    ICommunityStory,
} from '@ipcttypes/endpoints';
import { BeneficiaryAttributes } from '@models/ubi/beneficiary';
import { CommunityAttributes } from '@models/ubi/community';
import { ManagerAttributes } from '@models/ubi/manager';
import { BaseError } from '@utils/baseError';
import { Includeable, literal, Op } from 'sequelize';

import config from '../config';
import { models, sequelize } from '../database';
import Email from './email';
import { StoryContentStorage } from './storage';

export default class StoryService {
    public storyContent = models.storyContent;
    public storyCommunity = models.storyCommunity;
    public storyEngagement = models.storyEngagement;
    public storyUserEngagement = models.storyUserEngagement;
    public storyUserReport = models.storyUserReport;
    public community = models.community;
    public appMediaContent = models.appMediaContent;
    public appMediaThumbnail = models.appMediaThumbnail;
    public beneficiary = models.beneficiary;
    public manager = models.manager;
    public user = models.user;
    public sequelize = sequelize;

    private storyContentStorage = new StoryContentStorage();
    private email = new Email();

    public getPresignedUrlMedia(mime: string) {
        return this.storyContentStorage.getPresignedUrlPutObject(mime);
    }

    public async add(
        fromAddress: string,
        story: IAddStory
    ): Promise<ICommunityStory> {
        let storyContentToAdd: { mediaMediaId?: number; message?: string } = {};
        if (story.mediaId) {
            storyContentToAdd = {
                mediaMediaId: story.mediaId,
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
        if (story.communityId !== undefined) {
            storyCommunityToAdd = {
                storyCommunity: [
                    {
                        communityId: story.communityId,
                    },
                ],
            };
        }
        const created = await this.storyContent.create(
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
                    { model: this.storyCommunity, as: 'storyCommunity' },
                    { model: this.storyEngagement, as: 'storyEngagement' },
                ],
            }
        );
        const newStory = created.toJSON() as StoryContent;
        if (story.mediaId) {
            const media = await this.appMediaContent.findOne({
                where: { id: story.mediaId },
                include: [
                    {
                        model: this.appMediaThumbnail,
                        as: 'thumbnails',
                    },
                ],
            });
            return {
                ...newStory,
                media: media!.toJSON() as AppMediaContent,
                loves: 0,
                userLoved: false,
                userReported: false,
            };
        }
        return { ...newStory, loves: 0, userLoved: false, userReported: false };
    }

    public async has(address: string): Promise<boolean> {
        const result = await this.storyContent.count({
            where: { byAddress: address },
        });
        return result !== 0;
    }

    public async remove(storyId: number, userAddress: string): Promise<number> {
        const contentPath = await this.storyContent.findOne({
            include: [
                {
                    model: this.appMediaContent,
                    as: 'media',
                    required: false,
                    include: [
                        {
                            model: this.appMediaThumbnail,
                            as: 'thumbnails',
                        },
                    ],
                },
            ],
            where: { id: storyId },
        });
        if (contentPath === null) {
            return 0;
        }
        const storyMedia = (contentPath.toJSON() as StoryContent).media;
        const result = await this.storyContent.destroy({
            where: { id: storyId, byAddress: userAddress },
        });
        if (storyMedia) {
            await this.storyContentStorage.deleteContent(storyMedia.id);
        }
        return result;
    }

    public async getByUser(
        onlyFromAddress: string,
        query: { offset?: string; limit?: string }
    ): Promise<{ count: number; content: ICommunityStories }> {
        const r = await this.storyContent.findAndCountAll({
            include: [
                {
                    model: this.storyEngagement,
                    as: 'storyEngagement',
                    duplicating: false,
                },
                {
                    model: this.appMediaContent,
                    as: 'media',
                    required: false,
                    include: [
                        {
                            model: this.appMediaThumbnail,
                            as: 'thumbnails',
                            separate: true,
                        },
                    ],
                },
                ...this._filterSubInclude(onlyFromAddress),
            ],
            where: { byAddress: onlyFromAddress, isPublic: true },
            order: [['postedAt', 'DESC']],
            offset: query.offset ? parseInt(query.offset, 10) : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
        });

        let result: BeneficiaryAttributes | ManagerAttributes;

        const beneficiaryResult = await this.beneficiary.findOne({
            attributes: ['address'],
            include: [
                {
                    model: models.community,
                    as: 'community',
                    attributes: ['id'],
                },
            ],
            where: { address: onlyFromAddress, active: true },
        });

        if (beneficiaryResult === null) {
            const managerResult = await this.manager.findOne({
                attributes: ['address'],
                include: [
                    {
                        model: models.community,
                        as: 'community',
                        attributes: ['id'],
                    },
                ],
                where: { address: onlyFromAddress, active: true },
            });
            if (managerResult === null) {
                throw new BaseError('USER_NOT_FOUND', 'user not found!');
            }
            result = managerResult.toJSON() as ManagerAttributes;
        } else {
            result = beneficiaryResult.toJSON() as BeneficiaryAttributes;
        }

        if (result.community === undefined) {
            throw new BaseError('COMMUNITY_NOT_FOUND', 'community not found!');
        }

        return {
            count: r.count,
            content: {
                id: result.community.id,
                // this information is on the user side already
                name: '',
                city: '',
                country: '',
                cover: {
                    id: 0,
                    url: '',
                    height: 0,
                    width: 0,
                },
                //
                stories: r.rows.map((c) => {
                    const content = c.toJSON() as StoryContent;
                    return {
                        id: content.id,
                        media: content.media,
                        message: content.message,
                        byAddress: content.byAddress,
                        loves: content.storyEngagement
                            ? content.storyEngagement.loves
                            : 0,
                        userLoved: content.storyUserEngagement
                            ? content.storyUserEngagement.length !== 0
                            : false,
                        userReported: content.storyUserReport
                            ? content.storyUserReport.length !== 0
                            : false,
                    };
                }),
            },
        };
    }

    public async list(query: {
        offset?: string;
        limit?: string;
        includeIPCT?: boolean;
    }): Promise<{ count: number; content: ICommunitiesListStories[] }> {
        let ipctMostRecent: ICommunitiesListStories | undefined;
        if (query.includeIPCT) {
            const r = await this.storyContent.findAll({
                include: [
                    {
                        model: this.appMediaContent,
                        as: 'media',
                        required: false,
                        include: [
                            {
                                model: this.appMediaThumbnail,
                                as: 'thumbnails',
                            },
                        ],
                    },
                ],
                where: {
                    byAddress: config.impactMarketContractAddress,
                    isPublic: true,
                },
                order: [['postedAt', 'DESC']],
                limit: 1,
            });
            if (r.length > 0) {
                const ipctCover = await this.appMediaContent.findOne({
                    include: [
                        {
                            model: this.appMediaThumbnail,
                            as: 'thumbnails',
                        },
                    ],
                    where: {
                        id: config.impactMarketStoryCoverId,
                    },
                });
                const story = r[0].toJSON() as StoryContent;
                ipctMostRecent = {
                    id: -1,
                    name: 'impactMarket',
                    cover: ipctCover!.toJSON() as AppMediaContent,
                    story,
                };
            }
        }
        const r = await this.storyContent.findAndCountAll({
            include: [
                {
                    model: this.storyCommunity,
                    as: 'storyCommunity',
                    include: [
                        {
                            model: this.community,
                            as: 'community',
                            attributes: ['id', 'name'],
                            include: [
                                {
                                    model: this.appMediaContent,
                                    as: 'cover',
                                    include: [
                                        {
                                            model: this.appMediaThumbnail,
                                            as: 'thumbnails',
                                            separate: true,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    model: this.storyEngagement,
                    as: 'storyEngagement',
                },
                {
                    model: this.appMediaContent,
                    as: 'media',
                    include: [
                        {
                            model: this.appMediaThumbnail,
                            as: 'thumbnails',
                            separate: true,
                        },
                    ],
                },
            ],
            where: {
                postedAt: {
                    // TODO: use query builder instead
                    [Op.eq]: literal(
                        `(select max("postedAt") from story_content sc, story_community sm where sc.id=sm."contentId" and sm."communityId"="storyCommunity"."communityId" and sc."isPublic"=true)`
                    ),
                },
            },
            order: [['postedAt', 'DESC']],
            offset: query.offset ? parseInt(query.offset, 10) : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
        });
        const communitiesStories = r.rows.map((c) => {
            const content = c.toJSON() as StoryContent;
            return {
                // we can use ! because it's uncluded on the query
                id: content.storyCommunity!.communityId,
                name: content.storyCommunity!.community!.name,
                cover: content.storyCommunity!.community!.cover!,
                story: {
                    id: content.id,
                    media: content.media,
                    message: content.message,
                },
            };
        });
        if (ipctMostRecent) {
            return {
                count: r.count + 1,
                content: [ipctMostRecent].concat(communitiesStories),
            };
        }
        return {
            count: r.count,
            content: communitiesStories,
        };
    }

    public async getByCommunity(
        communityId: number,
        query: { offset?: string; limit?: string },
        userAddress?: string
    ): Promise<{ count: number; content: ICommunityStories }> {
        if (communityId === -1) {
            return this._listImpactMarketOnly(userAddress);
        }

        const subInclude = this._filterSubInclude(userAddress);
        const r = await this.storyCommunity.findAndCountAll({
            include: [
                {
                    model: this.storyContent,
                    as: 'storyContent',
                    required: true,
                    include: [
                        {
                            model: this.appMediaContent,
                            as: 'media',
                            required: false,
                            include: [
                                {
                                    model: this.appMediaThumbnail,
                                    as: 'thumbnails',
                                    separate: true,
                                },
                            ],
                        },
                        ...subInclude,
                    ],
                },
            ],
            where: {
                communityId,
                '$"storyContent"."isPublic"$': {
                    [Op.eq]: true,
                },
            } as any,
            offset: query.offset ? parseInt(query.offset, 10) : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
            order: [['storyContent', 'postedAt', 'DESC']],
        });

        if (r.rows.length === 0) {
            throw new BaseError(
                'STORIES_NOT_FOUND',
                `No stories for community ${communityId}`
            );
        }

        // at this point, this is not null
        const community = (await this.community.findOne({
            attributes: ['id', 'name', 'city', 'country'],
            include: [
                {
                    model: this.appMediaContent,
                    as: 'cover',
                    include: [
                        {
                            model: this.appMediaThumbnail,
                            as: 'thumbnails',
                            separate: true,
                        },
                    ],
                },
            ],
            where: { id: communityId },
        }))!.toJSON() as CommunityAttributes;
        return {
            count: r.count,
            content: {
                id: community.id,
                name: community.name,
                city: community.city,
                country: community.country,
                cover: community.cover!,
                // we can use ! because it's filtered on the query
                stories: r.rows.map((s) => {
                    const content = (s.toJSON() as StoryCommunity)
                        .storyContent!;
                    return {
                        id: content.id,
                        media: content.media,
                        message: content.message,
                        byAddress: content.byAddress,
                        loves: content.storyEngagement
                            ? content.storyEngagement.loves
                            : 0,
                        userLoved: userAddress
                            ? content.storyUserEngagement!.length !== 0
                            : false,
                        userReported: userAddress
                            ? content.storyUserReport!.length !== 0
                            : false,
                    };
                }),
            },
        };
    }

    public async love(userAddress: string, contentId: number) {
        try {
            await this.storyUserEngagement.create({
                contentId,
                address: userAddress,
            });
        } catch (e) {
            await this.storyUserEngagement.destroy({
                where: { contentId, address: userAddress },
            });
        }
    }

    public async inapropriate(userAddress: string, contentId: number) {
        try {
            await this.storyUserReport.create({
                contentId,
                address: userAddress,
            });
            // eslint-disable-next-line no-new
            new Promise(async () => {
                const storyContent = (await this.storyContent.findOne({
                    include: [
                        {
                            model: this.appMediaContent,
                            as: 'media',
                            required: false,
                        },
                    ],
                    where: { id: contentId },
                }))!.toJSON() as StoryContent;
                await this.email.notify({
                    to: config.internalEmailToNotify,
                    from: config.internalEmailNotifying,
                    subject: 'Story Marked as Inapropriate',
                    text: `Story with id ${contentId} with media " ${storyContent.media?.url} " and message " ${storyContent.message} " was marked as inapropriate. See here https://impactmarket-cms-${process.env.API_ENVIRONMENT}.herokuapp.com/admin/collections/story_content/${contentId}`,
                });
            });
        } catch (e) {
            await this.storyUserReport.destroy({
                where: { contentId, address: userAddress },
            });
        }
    }

    public async deleteOlderStories() {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 30);
        //
        const mostRecentStoryByCommunity = await models.storyContent.findAll({
            attributes: ['id'],
            include: [
                {
                    model: this.storyCommunity,
                    as: 'storyCommunity',
                    attributes: [],
                },
            ],
            where: {
                postedAt: {
                    // TODO: use query builder instead
                    [Op.eq]: literal(
                        `(select max("postedAt") from story_content sc, story_community sm where sc.id=sm."contentId" and sm."communityId"="storyCommunity"."communityId" and sc."isPublic"=true)`
                    ),
                },
            },
            order: [['postedAt', 'DESC']],
        });

        if (mostRecentStoryByCommunity.length === 0) {
            return;
        }

        const storiesToDelete = await models.storyContent.findAll({
            attributes: ['id', 'mediaMediaId'],
            where: {
                postedAt: {
                    [Op.lte]: tenDaysAgo,
                },
                id: {
                    [Op.notIn]: mostRecentStoryByCommunity.map((sbc) => sbc.id),
                },
            },
        });

        if (storiesToDelete.length === 0) {
            return;
        }
        await models.storyContent.destroy({
            where: {
                id: {
                    [Op.in]: storiesToDelete.map((s) => s.id),
                },
            },
        });
        await this.storyContentStorage.deleteBulkContent(
            storiesToDelete
                .filter((s) => s.mediaMediaId !== null)
                .map((s) => s.mediaMediaId!) // not null here
        );
    }

    public async _listImpactMarketOnly(
        userAddress?: string
    ): Promise<{ count: number; content: ICommunityStories }> {
        const subInclude = this._filterSubInclude(userAddress);
        const r = await this.storyContent.findAndCountAll({
            include: [
                ...subInclude,
                {
                    model: this.appMediaContent,
                    as: 'media',
                    required: false,
                    include: [
                        {
                            model: this.appMediaThumbnail,
                            as: 'thumbnails',
                            separate: true,
                        },
                    ],
                },
            ],
            where: {
                byAddress: config.impactMarketContractAddress,
                isPublic: true,
            },
            order: [['postedAt', 'DESC']],
        });
        const stories: ICommunityStory[] = r.rows.map((c) => {
            const content = c.toJSON() as StoryContent;
            return {
                id: content.id,
                media: content.media,
                message: content.message,
                byAddress: content.byAddress,
                loves: content.storyEngagement!.loves,
                userLoved: userAddress
                    ? content.storyUserEngagement!.length !== 0
                    : false,
                userReported: userAddress
                    ? content.storyUserReport!.length !== 0
                    : false,
            };
        });
        const ipctCover = await this.appMediaContent.findOne({
            include: [
                {
                    model: this.appMediaThumbnail,
                    as: 'thumbnails',
                },
            ],
            where: {
                id: config.impactMarketStoryCoverId,
            },
        });
        return {
            count: r.count,
            content: {
                id: -1,
                name: 'impactMarket',
                city: '',
                country: '',
                cover: ipctCover!.toJSON() as AppMediaContent,
                stories,
            },
        };
    }

    private _filterSubInclude(userAddress?: string) {
        let subInclude: Includeable[];
        if (userAddress) {
            subInclude = [
                {
                    model: this.storyEngagement,
                    as: 'storyEngagement',
                },
                {
                    model: this.storyUserEngagement,
                    as: 'storyUserEngagement',
                    required: false,
                    where: {
                        address: userAddress,
                    },
                },
                {
                    model: this.storyUserReport,
                    as: 'storyUserReport',
                    required: false,
                    where: {
                        address: userAddress,
                    },
                },
            ];
        } else {
            subInclude = [
                {
                    model: this.storyEngagement,
                    as: 'storyEngagement',
                },
            ];
        }
        return subInclude;
    }
}
