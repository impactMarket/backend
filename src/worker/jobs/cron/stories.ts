import StoryService from '@services/story';

export async function verifyStoriesLifecycle(): Promise<void> {
    //
    const stories = new StoryService();
    await stories.deleteOlderStories();
}
