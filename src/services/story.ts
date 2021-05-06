import { AppMediaContent } from '@interfaces/app/appMediaContent';
import { StoryCommunityCreationEager } from '@interfaces/story/storyCommunity';
import { StoryContent } from '@interfaces/story/storyContent';
import {
    IAddStory,
    ICommunitiesListStories,
    ICommunityStories,
    ICommunityStory,
} from '@ipcttypes/endpoints';
import { BeneficiaryAttributes } from '@models/ubi/beneficiary';
import { CommunityAttributes } from '@models/ubi/community';
import { Logger } from '@utils/logger';
import { Includeable, literal, Op, QueryTypes } from 'sequelize';

import config from '../config';
import { models, sequelize } from '../database';
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
    public user = models.user;
    public sequelize = sequelize;

    private storyContentStorage = new StoryContentStorage();

    public pictureAdd(file: Express.Multer.File) {
        return this.storyContentStorage.uploadContent(file);
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
        // first delete media
        if (storyMedia) {
            await this.storyContentStorage.deleteContent(storyMedia.id);
        }
        return await this.storyContent.destroy({
            where: { id: storyId, byAddress: userAddress },
        });
    }

    public async getByUser(
        order: string | undefined,
        query: { offset?: string; limit?: string },
        onlyFromAddress: string
    ): Promise<ICommunityStories> {
        const r = await this.storyContent.findAll({
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

        const beneficiaryResult = await this.beneficiary.findOne({
            include: [
                // {
                //     model: models.user,
                //     as: 'user',
                //     attributes: ['name'],
                //     include: [
                //         {
                //             model: this.appMediaContent,
                //             as: 'avatar',
                //             required: false,
                //             include: [
                //                 {
                //                     model: this.appMediaThumbnail,
                //                     as: 'thumbnails',
                //                 },
                //             ],
                //         },
                //     ],
                // },
                {
                    model: models.community,
                    as: 'community',
                    attributes: ['id'],
                    // include: [
                    //     {
                    //         model: this.appMediaContent,
                    //         as: 'cover',
                    //         required: false,
                    //         include: [
                    //             {
                    //                 model: this.appMediaThumbnail,
                    //                 as: 'thumbnails',
                    //             },
                    //         ],
                    //     },
                    // ],
                },
            ],
            where: { address: onlyFromAddress },
        });

        if (beneficiaryResult === null) {
            throw new Error('beneficiary not found!');
        }

        const beneficiary = beneficiaryResult.toJSON() as BeneficiaryAttributes;

        if (beneficiary.community === undefined) {
            throw new Error('beneficiary not found!');
        }

        return {
            id: beneficiary.community.id,
            // this information is on the user side already
            name: '',
            city: '',
            country: '',
            publicId: '',
            cover: {
                id: 0,
                url: '',
                height: 0,
                width: 0,
            },
            //
            stories: r.map((c) => {
                const content = c.toJSON() as StoryContent;
                return {
                    id: content.id,
                    media: content.media,
                    message: content.message,
                    byAddress: content.byAddress,
                    loves: content.storyEngagement!.loves,
                    userLoved: content.storyUserEngagement!.length !== 0,
                    userReported: content.storyUserReport!.length !== 0,
                };
            }),
        };
    }

    public async listByOrder(
        order: string | undefined,
        query: { offset?: string; limit?: string; includeIPCT?: boolean }
    ): Promise<ICommunitiesListStories[]> {
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
        const r = await this.community.findAll({
            attributes: ['id', 'name'],
            include: [
                {
                    model: this.appMediaContent,
                    as: 'cover',
                    include: [
                        {
                            model: this.appMediaThumbnail,
                            as: 'thumbnails',
                        },
                    ],
                },
                {
                    model: this.storyCommunity,
                    as: 'storyCommunity',
                    duplicating: false,
                    include: [
                        {
                            model: this.storyContent,
                            as: 'storyContent',
                            include: [
                                {
                                    model: this.storyEngagement,
                                    as: 'storyEngagement',
                                },
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
                                byAddress: { [Op.not]: null },
                            },
                        },
                    ],
                    where: {
                        contentId: { [Op.not]: null },
                    },
                },
            ],
            where: {
                visibility: 'public',
                status: 'valid',
                '$storyCommunity->storyContent.postedAt$': {
                    [Op.eq]: literal(`(select max("postedAt")
                    from story_content sc, story_community sm
                    where sc.id=sm."contentId" and sm."communityId"="Community".id and sc."isPublic"=true)`),
                },
            } as any, // does not recognize the string as a variable
            order: [['storyCommunity', 'storyContent', 'postedAt', 'DESC']],
            offset: query.offset ? parseInt(query.offset, 10) : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
        });
        const communitiesStories = r.map((c) => {
            const community = c.toJSON() as CommunityAttributes;
            return {
                id: community.id,
                name: community.name,
                cover: community.cover!,
                // we can use ! because it's filtered on the query
                story: community.storyCommunity!.map((s) => ({
                    id: s.storyContent!.id,
                    media: s.storyContent!.media,
                    message: s.storyContent!.message,
                }))[0],
            };
        });
        if (ipctMostRecent) {
            return [ipctMostRecent].concat(communitiesStories);
        }
        return communitiesStories;
    }

    public async getByCommunity(
        communityId: number,
        order: string | undefined,
        query: { offset?: string; limit?: string },
        userAddress?: string
    ): Promise<ICommunityStories> {
        if (communityId === -1) {
            return this._listImpactMarketOnly();
        }

        const subInclude = this._filterSubInclude(userAddress);
        const r = await this.storyContent.findAll({
            include: [
                {
                    model: this.storyCommunity,
                    as: 'storyCommunity',
                    include: [
                        {
                            model: this.community,
                            as: 'community',
                            include: [
                                {
                                    model: this.appMediaContent,
                                    as: 'cover',
                                    include: [
                                        {
                                            model: this.appMediaThumbnail,
                                            as: 'thumbnails',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    where: { communityId },
                },
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
                ...subInclude,
            ],
            where: { isPublic: true },
            offset: query.offset ? parseInt(query.offset, 10) : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
            order: [['postedAt', 'DESC']],
        });

        if (r.length === 0) {
            throw new Error('No stories for community ' + communityId);
        }

        // at this point, this is not null
        const community = (r[0].toJSON() as StoryContent).storyCommunity!
            .community!;
        return {
            id: community.id,
            publicId: community.publicId,
            name: community.name,
            city: community.city,
            country: community.country,
            cover: community.cover!,
            // we can use ! because it's filtered on the query
            stories: r.map((s) => {
                const content = s.toJSON() as StoryContent;
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
            }),
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
        } catch (e) {
            await this.storyUserReport.destroy({
                where: { contentId, address: userAddress },
            });
        }
    }

    public async deleteOlderStories() {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        //
        const storiesToDelete: {
            contentId: string;
            mediaMediaId: number;
        }[] = await this.sequelize.query(
            'select SC."contentId", ST."mediaMediaId" from community c, (select "communityId" from story_community group by "communityId" having count("contentId") > 1) SC1, (select max("postedAt") r from story_content) recent, story_community SC, story_content ST where date(ST."postedAt") < \'?\' and ST."postedAt" != recent.r and c.id = SC1."communityId" and c.id = SC."communityId" and ST.id = SC."contentId"',
            {
                replacements: [tenDaysAgo.toISOString().split('T')[0]],
                raw: true,
                type: QueryTypes.SELECT,
            }
        );

        await this.storyContent.destroy({
            where: {
                id: {
                    [Op.in]: storiesToDelete.map((s) =>
                        parseInt(s.contentId, 10)
                    ),
                },
            },
        });
        await this.storyContentStorage
            .deleteBulkContent(storiesToDelete.map((s) => s.mediaMediaId))
            .catch(Logger.error);
    }

    public async _listImpactMarketOnly(
        userAddress?: string
    ): Promise<ICommunityStories> {
        const subInclude = this._filterSubInclude(userAddress);
        const r = await this.storyContent.findAll({
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
        const stories: ICommunityStory[] = r.map((c) => {
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
            id: -1,
            publicId: 'impact-market',
            name: 'impactMarket',
            city: '',
            country: '',
            cover: ipctCover!.toJSON() as AppMediaContent,
            stories,
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
