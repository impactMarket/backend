import { models, sequelize } from '../database';
import {
    IAddStory,
    ICommunitiesListStories,
    ICommunityStories,
} from '@ipcttypes/endpoints';
import { CommunityAttributes } from '@models/community';
import { sharpAndUpload } from './storage';
import config from '../config';
import { literal, Op } from 'sequelize';
import { StoryCommunityCreationEager } from '@interfaces/story/storyCommunity';

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
        userAddress: string,
        communityId: number,
        order: string | undefined,
        query: any
    ): Promise<ICommunityStories> {
        const r = await this.community.findAll({
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
                                {
                                    model: this.storyUserEngagement,
                                    as: 'storyUserEngagement',
                                    where: {
                                        address: userAddress,
                                    },
                                },
                            ],
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
                    userLoved:
                        s.storyContent!.storyUserEngagement!.length !== 0,
                })),
            };
        });
        return stories[0]; // there's only one community
    }

    public async love(userAddress: string, contentId: number) {
        try {
            return this.storyUserEngagement.create({
                contentId,
                address: userAddress,
            });
        } catch (e) {
            return this.storyUserEngagement.destroy({
                where: { contentId, address: userAddress },
            });
        }
    }
}
