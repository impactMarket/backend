import StoryService from '@services/story';

import config from '../../../config';

export async function verifyStoriesLifecycle(): Promise<void> {
    //
    if (config.storyCronActive) {
        const stories = new StoryService();
        await stories.deleteOlderStories();
    }
}
