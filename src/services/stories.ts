import { models, sequelize } from '../database';
import { IAddStory } from '@ipcttypes/endpoints';
import { CommunityAttributes } from '@models/community';
import { sharpAndUpload } from './storage';
import config from '../config';
import { col, fn, literal, Op } from 'sequelize';

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
        let storyContentToAdd = {};
        if (file) {
            const media = await sharpAndUpload(file);
            storyContentToAdd = {
                media: `${config.cloudfrontUrl}/${media.Key}`,
            };
        }
        let storyCommunityToAdd = {};
        // if (story.media !== undefined) {
        //     storyContentToAdd = {
        //         media: story.media,
        //     };
        // }
        if (story.message !== undefined) {
            storyContentToAdd = {
                ...storyContentToAdd,
                message: story.message,
            };
        }
        if (story.communityId !== undefined) {
            storyCommunityToAdd = {
                StoriesCommunityModel: [
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
                StoriesEngagementModel: [],
            },
            {
                include: [
                    sequelize.models.StoriesCommunityModel,
                    sequelize.models.StoriesEngagementModel,
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

    public async listByOrder(order: string | undefined, query: any) {
        const r = await this.community.findAll({
            attributes: ['id', 'name'],
            include: [
                {
                    model: sequelize.models.StoriesCommunityModel,
                    include: [
                        {
                            model: sequelize.models.StoriesContentModel,
                            include: [sequelize.models.StoriesEngagementModel],
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
                '$StoriesCommunityModels->StoriesContentModel.postedAt$': {
                    [Op.eq]: literal(`(select max("postedAt")
                        from "StoriesContent" sc, "StoriesCommunity" sm
                        where sc.id = sm."contentId" and sm."communityId"="Community".id)`),
                },
            } as any, // does not recognize the string as a variable
            order: [
                [
                    sequelize.models.StoriesCommunityModel,
                    sequelize.models.StoriesContentModel,
                    'postedAt',
                    'DESC',
                ],
            ],
        });
        const stories = r.map((c) => {
            const community = c.toJSON() as CommunityAttributes;
            return {
                id: community.id,
                name: community.name,
                // we can use ! because it's filtered on the query
                stories: community.StoriesCommunityModels!.map((s) => ({
                    id: s.StoriesContentModel!.id,
                    media: s.StoriesContentModel!.media,
                    message: s.StoriesContentModel!.message,
                    love: s.StoriesContentModel!.StoriesEngagementModel?.love,
                }))[0],
            };
        });
        return stories;
    }

    public async getByCommunity(
        communityId: number,
        order: string | undefined,
        query: any
    ) {
        const r = await this.community.findAll({
            include: [
                {
                    model: sequelize.models.StoriesCommunityModel,
                    include: [
                        {
                            model: sequelize.models.StoriesContentModel,
                            include: [sequelize.models.StoriesEngagementModel],
                        },
                    ],
                },
            ],
            where: {
                id: communityId,
            },
            order: [
                [
                    sequelize.models.StoriesCommunityModel,
                    sequelize.models.StoriesContentModel,
                    'postedAt',
                    'DESC',
                ],
            ],
        });
        const stories = r.map((c) => {
            const community = c.toJSON() as CommunityAttributes;
            return {
                id: community.id,
                name: community.name,
                city: community.city,
                country: community.country,
                stories: community.StoriesCommunityModels?.map((s) => ({
                    id: s.StoriesContentModel?.id,
                    media: s.StoriesContentModel?.media,
                    message: s.StoriesContentModel?.message,
                    love: s.StoriesContentModel?.StoriesEngagementModel?.love,
                })),
            };
        });
        return stories[0];
    }

    public async love(contentId: number) {
        //
    }
}
