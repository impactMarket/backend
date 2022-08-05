import { ethers } from 'ethers';
import { Includeable, literal, Op } from 'sequelize';
import { Literal } from 'sequelize/types/lib/utils';

import config from '../config';
import { models, sequelize } from '../database';
import { AppMediaContent } from '../interfaces/app/appMediaContent';
import {
    StoryCommunity,
    StoryCommunityCreationEager,
} from '../interfaces/story/storyCommunity';
import { StoryContent } from '../interfaces/story/storyContent';
import { CommunityAttributes } from '../interfaces/ubi/community';
import { getUserRoles } from '../subgraph/queries/user';
import { BaseError } from '../utils/baseError';
import { Logger } from '../utils/logger';
import { createThumbnailUrl } from '../utils/util';
import Email from './email';
import {
    IAddStory,
    ICommunitiesListStories,
    ICommunityStories,
    ICommunityStory,
} from './endpoints';
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
    public manager = models.manager;
    public user = models.appUser;
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
        let storyContentToAdd: {
            mediaMediaId?: number;
            storyMediaPath?: string;
            message?: string;
            storyMedia?: string[];
        } = {};
        if (story.storyMediaPath) {
            storyContentToAdd = {
                storyMediaPath: story.storyMediaPath,
                storyMedia: [story.storyMediaPath],
            };
        }
        if (story.storyMediaId) {
            storyContentToAdd = {
                ...storyContentToAdd,
                mediaMediaId: story.storyMediaId,
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
            const community = await this.community.findOne({
                attributes: ['id'],
                where: {
                    id: story.communityId,
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
                },
                ...this._filterSubInclude(onlyFromAddress),
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

        const content: StoryContent[] = r.rows.map((el) => {
            const story = el.toJSON() as StoryContent;
            if (story.storyMediaPath) {
                const thumbnails = createThumbnailUrl(
                    config.aws.bucket.story,
                    story.storyMediaPath!,
                    config.thumbnails.story
                );
                return {
                    ...story,
                    media: {
                        id: 0,
                        width: 0,
                        height: 0,
                        url: `${config.cloudfrontUrl}/${story.storyMediaPath}`,
                        thumbnails,
                    },
                };
            } else if (story.mediaMediaId && story.media) {
                const media = story.media;

                const thumbnails = createThumbnailUrl(
                    config.aws.bucket.story,
                    media!.url.split(config.cloudfrontUrl + '/')[1],
                    config.thumbnails.story
                );
                return {
                    ...story,
                    media: {
                        id: 0,
                        width: media!.width,
                        height: media!.height,
                        url: media!.url,
                        thumbnails,
                    },
                };
            } else {
                return {
                    ...story,
                    media: {},
                } as any;
            }
        });

        const userRoles = await getUserRoles(onlyFromAddress);

        if (!userRoles.beneficiary && !userRoles.manager) {
            throw new BaseError('USER_NOT_FOUND', 'user not found!');
        }

        const contractAddress = userRoles.beneficiary
            ? userRoles.beneficiary.community
            : userRoles.manager?.community;

        const community = await models.community.findOne({
            attributes: ['id'],
            where: {
                contractAddress: ethers.utils.getAddress(contractAddress!),
            },
        });

        if (!community) {
            throw new BaseError('COMMUNITY_NOT_FOUND', 'community not found!');
        }

        return {
            count: r.count,
            content: {
                id: community.id,
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
                stories: content.map((c: StoryContent) => {
                    return {
                        id: c.id,
                        media: c.media,
                        message: c.message,
                        byAddress: c.byAddress,
                        loves: c.storyEngagement ? c.storyEngagement.loves : 0,
                        userLoved: c.storyUserEngagement
                            ? c.storyUserEngagement.length !== 0
                            : false,
                        userReported: c.storyUserReport
                            ? c.storyUserReport.length !== 0
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
                const ipctCover = (
                    await this.appMediaContent.findOne({
                        where: {
                            id: config.impactMarketStoryCoverId,
                        },
                    })
                )?.toJSON() as AppMediaContent;
                if (ipctCover) {
                    ipctCover.thumbnails = createThumbnailUrl(
                        config.aws.bucket.story,
                        ipctCover.url.split(config.cloudfrontUrl + '/')[1],
                        config.thumbnails.story
                    );
                }

                const story = r[0].toJSON() as StoryContent;
                if (story.storyMediaPath) {
                    const thumbnails = createThumbnailUrl(
                        config.aws.bucket.story,
                        story.storyMediaPath,
                        config.thumbnails.story
                    );
                    story.media = {
                        id: 0,
                        width: 0,
                        height: 0,
                        url: `${config.cloudfrontUrl}/${story.storyMediaPath}`,
                        thumbnails,
                    };
                } else if (story.mediaMediaId && story.media) {
                    const media = story.media;

                    const thumbnails = createThumbnailUrl(
                        config.aws.bucket.story,
                        media.url.split(config.cloudfrontUrl + '/')[1],
                        config.thumbnails.story
                    );
                    story.media = {
                        id: 0,
                        width: media.width,
                        height: media.height,
                        url: media.url,
                        thumbnails,
                    };
                }
                ipctMostRecent = {
                    id: -1,
                    name: 'impactMarket',
                    cover: ipctCover,
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
                            attributes: [
                                'id',
                                'name',
                                'coverMediaPath',
                                'coverMediaId',
                            ],
                            include: [
                                {
                                    model: this.appMediaContent,
                                    as: 'cover',
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
                },
            ],
            where: {
                postedAt: {
                    // TODO: use query builder instead
                    [Op.eq]: literal(
                        `(select max("postedAt") from story_content sc, story_community sm where sc.id=sm."contentId" and sm."communityId"="storyCommunity"."communityId" and sc."isPublic"=true)`
                    ),
                } as { [Op.eq]: Literal },
            },
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

            // get cover thumbnails
            if (content.storyCommunity?.community?.coverMediaPath) {
                const thumbnails = createThumbnailUrl(
                    config.aws.bucket.community,
                    content.storyCommunity.community.coverMediaPath,
                    config.thumbnails.community.cover
                );
                content.storyCommunity.community!.cover = {
                    id: 0,
                    width: 0,
                    height: 0,
                    url: `${config.cloudfrontUrl}/${content.storyCommunity.community.coverMediaPath}`,
                    thumbnails,
                };
            } else if (
                content.storyCommunity?.community?.coverMediaId &&
                content.storyCommunity?.community?.cover
            ) {
                const media = content.storyCommunity.community.cover;

                const thumbnails = createThumbnailUrl(
                    config.aws.bucket.community,
                    media.url.split(config.cloudfrontUrl + '/')[1],
                    config.thumbnails.community.cover
                );
                content.storyCommunity.community!.cover = {
                    id: 0,
                    width: media.width,
                    height: media.height,
                    url: media.url,
                    thumbnails,
                };
            }

            // get story thumbnails
            if (content.storyMediaPath) {
                const thumbnails = createThumbnailUrl(
                    config.aws.bucket.community,
                    content.storyMediaPath,
                    config.thumbnails.community.cover
                );
                content.media = {
                    id: 0,
                    width: 0,
                    height: 0,
                    url: `${config.cloudfrontUrl}/${content.storyMediaPath}`,
                    thumbnails,
                };
            } else if (content.mediaMediaId && content.media) {
                const media = content.media;

                const thumbnails = createThumbnailUrl(
                    config.aws.bucket.story,
                    media.url.split(config.cloudfrontUrl + '/')[1],
                    config.thumbnails.story
                );
                content.media = {
                    id: 0,
                    width: media.width,
                    height: media.height,
                    url: media.url,
                    thumbnails,
                };
            }

            return {
                // we can use ! because it's uncluded on the query
                id: content.storyCommunity!.communityId,
                name: content.storyCommunity!.community!.name,
                cover: content.storyCommunity!.community!.cover!,
                coverMediaPath:
                    content.storyCommunity!.community!.coverMediaPath!,
                story: {
                    id: content.id,
                    media: content.media,
                    storyMediaPath: content.storyMediaPath,
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
        try {
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
                offset: query.offset
                    ? parseInt(query.offset, 10)
                    : config.defaultOffset,
                limit: query.limit
                    ? parseInt(query.limit, 10)
                    : config.defaultLimit,
                order: [['storyContent', 'postedAt', 'DESC']],
            });

            if (r.rows.length === 0) {
                throw new BaseError(
                    'STORIES_NOT_FOUND',
                    `No stories for community ${communityId}`
                );
            }

            const stories = r.rows.map((s) => {
                const content = (s.toJSON() as StoryCommunity).storyContent!;

                if (content.storyMediaPath) {
                    const thumbnails = createThumbnailUrl(
                        config.aws.bucket.story,
                        content.storyMediaPath,
                        config.thumbnails.story
                    );
                    content.media = {
                        id: 0,
                        width: 0,
                        height: 0,
                        url: `${config.cloudfrontUrl}/${content.storyMediaPath}`,
                        thumbnails,
                    };
                } else if (content.mediaMediaId && content.media) {
                    const media = content.media;

                    const thumbnails = createThumbnailUrl(
                        config.aws.bucket.story,
                        media.url.split(config.cloudfrontUrl + '/')[1],
                        config.thumbnails.story
                    );
                    content.media = {
                        id: 0,
                        width: media.width,
                        height: media.height,
                        url: media.url,
                        thumbnails,
                    };
                }
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
            });

            // at this point, this is not null
            const community = (await this.community.findOne({
                attributes: [
                    'id',
                    'name',
                    'city',
                    'country',
                    'coverMediaId',
                    'coverMediaPath',
                ],
                where: { id: communityId },
            }))!.toJSON() as CommunityAttributes;
            if (community.coverMediaPath) {
                const thumbnails = createThumbnailUrl(
                    config.aws.bucket.community,
                    community.coverMediaPath,
                    config.thumbnails.community.cover
                );
                community.cover = {
                    id: 0,
                    width: 0,
                    height: 0,
                    url: `${config.cloudfrontUrl}/${community.coverMediaPath}`,
                    thumbnails,
                };
            } else if (community.coverMediaId) {
                const media = await models.appMediaContent.findOne({
                    attributes: ['url', 'width', 'height'],
                    where: {
                        id: community.coverMediaId,
                    },
                });

                if (media) {
                    const thumbnails = createThumbnailUrl(
                        config.aws.bucket.community,
                        media.url.split(config.cloudfrontUrl + '/')[1],
                        config.thumbnails.community.cover
                    );
                    community.cover = {
                        id: 0,
                        width: media.width,
                        height: media.height,
                        url: media.url,
                        thumbnails,
                    };
                }
            }

            return {
                count: r.count,
                content: {
                    id: community.id,
                    name: community.name,
                    city: community.city,
                    country: community.country,
                    cover: community.cover!,
                    // we can use ! because it's filtered on the query
                    stories,
                },
            };
        } catch (error) {
            Logger.warn(
                `Error to get story for community ${communityId} ${error}`
            );
            throw error;
        }
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
            if (content.storyMediaPath) {
                const thumbnails = createThumbnailUrl(
                    config.aws.bucket.story,
                    content.storyMediaPath,
                    config.thumbnails.story
                );
                content.media = {
                    id: 0,
                    width: 0,
                    height: 0,
                    url: `${config.cloudfrontUrl}/${content.storyMediaPath}`,
                    thumbnails,
                };
            } else if (content.mediaMediaId && content.media) {
                const media = content.media;

                const thumbnails = createThumbnailUrl(
                    config.aws.bucket.story,
                    media.url.split(config.cloudfrontUrl + '/')[1],
                    config.thumbnails.story
                );
                content.media = {
                    id: 0,
                    width: media.width,
                    height: media.height,
                    url: media.url,
                    thumbnails,
                };
            }
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
        const ipctCover = (await this.appMediaContent.findOne({
            where: {
                id: config.impactMarketStoryCoverId,
            },
        }))!.toJSON() as AppMediaContent;
        ipctCover.thumbnails = createThumbnailUrl(
            config.aws.bucket.community,
            ipctCover.url.split(config.cloudfrontUrl + '/')[1],
            config.thumbnails.community.cover
        );
        return {
            count: r.count,
            content: {
                id: -1,
                name: 'impactMarket',
                city: '',
                country: '',
                cover: ipctCover,
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
                    duplicating: false,
                    where: {
                        address: userAddress,
                    },
                },
                {
                    model: this.storyUserReport,
                    as: 'storyUserReport',
                    required: false,
                    duplicating: false,
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
