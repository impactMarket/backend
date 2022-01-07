import { services, config } from 'impactmarket-core';

export async function verifyStoriesLifecycle(): Promise<void> {
    //
    if (config.storyCronActive) {
        const stories = new services.StoryService();
        await stories.deleteOlderStories();
    }
}
