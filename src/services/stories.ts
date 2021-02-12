import { models, sequelize } from '../database';
import { IAddStory } from '@ipcttypes/endpoints';

export default class StoriesService {
    public static storyContent = models.storyContent;
    public static storyCommunity = models.storyCommunity;
    public static storyEngagement = models.storyEngagement;
    public static sequelize = sequelize;

    public static async add(story: IAddStory) {
        const t = await this.sequelize.transaction();
        try {
            let storyContentToAdd = {};
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
            const newStory = await this.storyContent.create(
                {
                    ...storyContentToAdd,
                    postedAt: new Date(),
                },
                {
                    transaction: t,
                }
            );
            if (story.communityId !== undefined) {
                await this.storyCommunity.create(
                    {
                        contentId: newStory.id,
                        communityId: story.communityId,
                    },
                    {
                        transaction: t,
                    }
                );
            }
            await this.storyEngagement.create(
                {
                    contentId: newStory.id,
                },
                {
                    transaction: t,
                }
            );
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit();
            return true;
        } catch (error) {
            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            // Since this is the service, we throw the error back to the controller,
            // so the route returns an error.
            throw new Error(error);
        }
    }

    public static async getByOrder(order: string | undefined, query: any) {
        //
    }

    public static async love(contentId: number) {
        //
    }
}
