import { models, sequelize } from '../database';
import { IAddStory } from '@ipcttypes/endpoints';
import { CommunityAttributes } from '@models/community';

export default class StoriesService {
    public static storyContent = models.storyContent;
    public static storyCommunity = models.storyCommunity;
    public static storyEngagement = models.storyEngagement;
    public static community = models.community;
    public static sequelize = sequelize;

    public static async add(story: IAddStory) {
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

    public static async getByOrder(order: string | undefined, query: any) {
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
                stories: community.StoriesCommunityModels?.map((s: any) => ({
                    media: s.StoriesContentModel.media,
                    message: s.StoriesContentModel.message,
                    love: s.StoriesContentModel.StoriesEngagementModel?.love,
                })),
            };
        });
        return stories;
    }

    public static async love(contentId: number) {
        //
    }
}
