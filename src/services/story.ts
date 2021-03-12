import { models, sequelize } from '../database';
import {
    IAddStory,
    ICommunitiesListStories,
    ICommunityStories,
    UserStory,
} from '@ipcttypes/endpoints';
import { CommunityAttributes } from '@models/community';
import { deleteContentFromS3, sharpAndUpload } from './storage';
import config from '../config';
import { Includeable, literal, Op } from 'sequelize';
import { StoryCommunityCreationEager } from '@interfaces/story/storyCommunity';
import { StoryContent } from '@interfaces/story/storyContent';

export default class StoryService {
    public storyContent = models.storyContent;
    public storyCommunity = models.storyCommunity;
    public storyEngagement = models.storyEngagement;
    public storyUserEngagement = models.storyUserEngagement;
    public community = models.community;
    public sequelize = sequelize;

    public async add(
        file: Express.Multer.File | undefined,
        story: IAddStory
    ): Promise<boolean> {
        let storyContentToAdd: { media?: string; message?: string } = {};
        if (file) {
            const media = await sharpAndUpload(file);
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
                byAddress: story.byAddress,
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
            deleteContentFromS3(contentPath.media);
        }
        return destroyed;
    }

    public async listByUser(
        order: string | undefined,
        query: any,
        onlyFromAddress: string
    ): Promise<UserStory[]> {
        const r = await this.storyContent.findAll({
            include: [
                {
                    model: this.storyEngagement,
                    as: 'storyEngagement',
                },
            ],
            where: { byAddress: onlyFromAddress },
            order: [['postedAt', 'DESC']],
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

    public async listByOrder(
        order: string | undefined,
        query: any
    ): Promise<ICommunitiesListStories[]> {
        const r = await this.community.findAll({
            attributes: ['id', 'name', 'coverImage'],
            include: [
                {
                    model: this.storyCommunity,
                    as: 'storyCommunity',
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
                        from "StoryContent" sc, "StoryCommunity" sm
                        where sc.id = sm."contentId" and sm."communityId"="Community".id)`),
                },
            } as any, // does not recognize the string as a variable
            order: [['storyCommunity', 'storyContent', 'postedAt', 'DESC']],
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
        query: any,
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
            ];
        } else {
            subInclude = [
                {
                    model: this.storyEngagement,
                    as: 'storyEngagement',
                },
            ];
        }
        const r = await this.community.findAll({
            include: [
                {
                    model: this.storyCommunity,
                    as: 'storyCommunity',
                    include: [
                        {
                            model: this.storyContent,
                            as: 'storyContent',
                            include: subInclude,
                        },
                    ],
                },
            ],
            where: {
                id: communityId,
            },
            order: [['storyCommunity', 'storyContent', 'postedAt', 'DESC']],
        });
        const stories = r.map((c) => {
            const community = c.toJSON() as CommunityAttributes;
            console.log(community.storyCommunity);
            return {
                id: community.id,
                publicId: community.publicId,
                name: community.name,
                city: community.city,
                country: community.country,
                coverImage: community.coverImage,
                // we can use ! because it's filtered on the query
                stories: community.storyCommunity!.map((s) => ({
                    id: s.storyContent!.id,
                    media: s.storyContent!.media,
                    message: s.storyContent!.message,
                    loves: s.storyContent!.storyEngagement!.loves,
                    userLoved: userAddress
                        ? s.storyContent!.storyUserEngagement!.length !== 0
                        : false,
                })),
            };
        });
        return stories[0]; // there's only one community
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
}
