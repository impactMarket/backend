import { models, sequelize } from '../database';
import {
    IAddStory,
    ICommunitiesListStories,
    ICommunityStories,
    ICommunityStory,
    UserStory,
} from '@ipcttypes/endpoints';
import { CommunityAttributes } from '@models/ubi/community';
import {
    deleteBulkContentFromS3,
    deleteContentFromS3,
    sharpAndUpload,
} from './storage';
import config from '../config';
import { Includeable, literal, Op, QueryTypes } from 'sequelize';
import { StoryCommunityCreationEager } from '@interfaces/story/storyCommunity';
import { StoryContent } from '@interfaces/story/storyContent';
import { Logger } from '@utils/logger';

export default class StoryService {
    public storyContent = models.storyContent;
    public storyCommunity = models.storyCommunity;
    public storyEngagement = models.storyEngagement;
    public storyUserEngagement = models.storyUserEngagement;
    public storyUserReport = models.storyUserReport;
    public community = models.community;
    public sequelize = sequelize;

    public async add(
        file: Express.Multer.File | undefined,
        fromAddress: string,
        story: IAddStory
    ): Promise<boolean> {
        let storyContentToAdd: { media?: string; message?: string } = {};
        if (file === undefined || story.message === undefined) {
            throw new Error('Story needs at least media or message.');
        }
        if (file) {
            const media = await sharpAndUpload(
                file,
                config.aws.bucketImagesStory
            );
            storyContentToAdd = {
                media: `${config.cloudfrontUrl}/${media.Key}`,
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
        await this.storyContent.create(
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
        return true;
    }

    public async has(address: string): Promise<boolean> {
        const result = await this.storyContent.count({
            where: { byAddress: address },
        });
        return result !== 0;
    }

    public async remove(storyId: number, userAddress: string): Promise<number> {
        const contentPath = await this.storyContent.findOne({
            where: { id: storyId },
        });
        if (contentPath === null) {
            return 0;
        }
        const destroyed = await this.storyContent.destroy({
            where: { id: storyId, byAddress: userAddress },
        });
        if (destroyed > 0) {
            deleteContentFromS3(
                config.aws.bucketImagesStory,
                contentPath.media
            );
        }
        return destroyed;
    }

    public async listByUser(
        order: string | undefined,
        query: { offset?: string; limit?: string },
        onlyFromAddress: string
    ): Promise<UserStory[]> {
        const r = await this.storyContent.findAll({
            include: [
                {
                    model: this.storyEngagement,
                    as: 'storyEngagement',
                    duplicating: false,
                },
            ],
            where: { byAddress: onlyFromAddress, isPublic: true },
            order: [['postedAt', 'DESC']],
            offset: query.offset ? parseInt(query.offset, 10) : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
        });
        const stories = r.map((c) => {
            const content = c.toJSON() as StoryContent;
            return {
                id: content.id,
                media: content.media,
                message: content.message,
                loves: content.storyEngagement!.loves,
            };
        });
        return stories;
    }

    public async listImpactMarketOnly(
        userAddress?: string
    ): Promise<ICommunityStories> {
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
        const r = await this.storyContent.findAll({
            include: subInclude,
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
                loves: content.storyEngagement!.loves,
                userLoved: userAddress
                    ? content.storyUserEngagement!.length !== 0
                    : false,
                userReported: userAddress
                    ? content.storyUserReport!.length !== 0
                    : false,
            };
        });
        return {
            id: 0,
            publicId: 'impact-market',
            name: '',
            city: '',
            country: '',
            coverImage: '',
            stories,
        };
    }

    public async listByOrder(
        order: string | undefined,
        query: { offset?: string; limit?: string }
    ): Promise<ICommunitiesListStories[]> {
        const r = await this.community.findAll({
            attributes: ['id', 'name', 'coverImage'],
            include: [
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
        const stories = r.map((c) => {
            const community = c.toJSON() as CommunityAttributes;
            return {
                id: community.id,
                name: community.name,
                coverImage: community.coverImage,
                // we can use ! because it's filtered on the query
                story: community.storyCommunity!.map((s) => ({
                    id: s.storyContent!.id,
                    media: s.storyContent!.media,
                    message: s.storyContent!.message,
                }))[0],
            };
        });
        return stories;
    }

    public async getByCommunity(
        communityId: number,
        order: string | undefined,
        query: { offset?: string; limit?: string },
        userAddress?: string
    ): Promise<ICommunityStories> {
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
        const r = await this.storyContent.findAll({
            include: [
                {
                    model: this.storyCommunity,
                    as: 'storyCommunity',
                    include: [
                        {
                            model: this.community,
                            as: 'community',
                        },
                    ],
                    where: { communityId },
                },
                ...subInclude,
            ],
            where: { isPublic: true },
            offset: query.offset ? parseInt(query.offset, 10) : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
            order: [['postedAt', 'DESC']],
        });

        // at this point, this is not null
        const community = (r[0].toJSON() as StoryContent).storyCommunity!
            .community!;
        return {
            id: community.id,
            publicId: community.publicId,
            name: community.name,
            city: community.city,
            country: community.country,
            coverImage: community.coverImage,
            // we can use ! because it's filtered on the query
            stories: r.map((s) => {
                const content = s.toJSON() as StoryContent;
                return {
                    id: content.id,
                    media: content.media,
                    message: content.message,
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
        const storiesToDelete = await this.sequelize.query(
            `select SC."contentId", ST.media
            from community c,
            (select "communityId" from story_community group by "communityId" having count("contentId") > 1) SC1,
            (select max("postedAt") r from story_content) recent,
            story_community SC,
            story_content ST
            where date(ST."postedAt") < ${
                tenDaysAgo.toISOString().split('T')[0]
            }
            and ST."postedAt" != recent.r
            and c.id = SC1."communityId"
            and c.id = SC."communityId"
            and ST.id = SC."contentId"`,
            { raw: true, type: QueryTypes.SELECT }
        );

        deleteBulkContentFromS3(
            config.aws.bucketImagesStory,
            storiesToDelete.map((s: any) => s.media)
        ).catch(Logger.error);

        await this.storyContent.destroy({
            where: {
                id: {
                    [Op.in]: storiesToDelete.map((s: any) =>
                        parseInt(s.contentId, 10)
                    ),
                },
            },
        });
    }
}
