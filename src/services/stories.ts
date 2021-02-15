import { models, sequelize } from '../database';
import { IAddStory } from '@ipcttypes/endpoints';
import { CommunityAttributes } from '@models/community';

export default class StoriesService {
    public storyContent = models.storyContent;
    public storyCommunity = models.storyCommunity;
    public storyEngagement = models.storyEngagement;
    public community = models.community;
    public sequelize = sequelize;

    public async add(story: IAddStory): Promise<boolean> {
        let storyContentToAdd = {};
        let storyCommunityToAdd = {};
        if (story.media !== undefined) {
            storyContentToAdd = {
                media: story.media,
            };
        }
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

    public async getByOrder(order: string | undefined, query: any) {
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
        });
        const stories = r.map((c) => {
            const community = c.toJSON() as CommunityAttributes;
            return {
                id: community.id,
                name: community.name,
                stories: community.StoriesCommunityModels?.map((s) => ({
                    id: s.StoriesContentModel?.id,
                    media: s.StoriesContentModel?.media,
                    message: s.StoriesContentModel?.message,
                    love: s.StoriesContentModel?.StoriesEngagementModel?.love,
                })),
            };
        });
        return stories;
    }

    public async love(contentId: number) {
        //
    }
}
