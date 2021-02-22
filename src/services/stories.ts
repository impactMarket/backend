import { models, sequelize } from '../database';
import {
    IAddStory,
    ICommunitiesListStories,
    ICommunityStories,
} from '@ipcttypes/endpoints';
import { CommunityAttributes } from '@models/community';
import { sharpAndUpload } from './storage';
import config from '../config';
import { literal, Op, where } from 'sequelize';
import { StoriesCommunityCreationEager } from '@interfaces/stories/storiesCommunity';

export default class StoriesService {
    public storyContent = models.storyContent;
    public storyCommunity = models.storyCommunity;
    public storyEngagement = models.storyEngagement;
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
            storyCommunity?: StoriesCommunityCreationEager[];
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
                storyEngage: [],
            },
            {
                include: [
                    { model: this.storyCommunity, as: 'storyCommunity' },
                    { model: this.storyEngagement, as: 'storyEngage' },
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
                                    as: 'storyEngage',
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
                        from "StoriesContent" sc, "StoriesCommunity" sm
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
                stories: community.storyCommunity!.map((s) => ({
                    id: s.storyContent!.id,
                    media: s.storyContent!.media,
                    message: s.storyContent!.message,
                    love: s.storyContent!.storyEngage!.love,
                }))[0],
            };
        });
        return stories;
    }

    public async getByCommunity(
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
                                    as: 'storyEngage',
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
                    love: s.storyContent!.storyEngage!.love,
                })),
            };
        });
        return stories[0]; // there's only one community
    }

    public async love(contentId: number) {
        return this.storyEngagement.increment('love', { where: { contentId } });
    }
}
