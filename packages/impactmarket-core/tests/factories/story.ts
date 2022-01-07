import faker from 'faker';

import { models } from '../../database';
import { StoryContentModel } from '../../database/models/story/storyContent';
import { AppMediaContent } from '../../interfaces/app/appMediaContent';
import {
    StoryContent,
    StoryContentCreation,
} from '../../interfaces/story/storyContent';

/**
 * Generate an object which container attributes needed
 * to successfully create a user instance.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       An object to build the user from.
 */
const data = async (props: {
    address: string;
    communityId: number;
    postedAt: Date;
    media?: boolean;
}) => {
    let mediaContent: AppMediaContent | undefined = undefined;
    if (props.media === true) {
        mediaContent = await models.appMediaContent.create({
            height: 50,
            width: 50,
            url: faker.lorem.word(),
        });
    }
    const defaultProps: StoryContentCreation = {
        byAddress: props.address,
        isPublic: true,
        storyCommunity: [{ communityId: props.communityId }],
        storyEngagement: [],
        mediaMediaId: mediaContent ? mediaContent.id : undefined,
        message: faker.lorem.sentence(),
        postedAt: props.postedAt,
    };
    return defaultProps;
};
/**
 * Generates a user instance from the properties provided.
 *
 * @param  {Object} props Properties to use for the user.
 *
 * @return {Object}       A user instance
 */
const StoryFactory = async (
    props: {
        address: string;
        communityId: number;
        postedAt: Date;
        media?: boolean;
    }[]
) => {
    const result: StoryContent[] = [];
    for (let index = 0; index < props.length; index++) {
        const newStory: any = await StoryContentModel.create(
            await data(props[index]),
            {
                include: [
                    {
                        model: models.storyCommunity,
                        as: 'storyCommunity',
                    },
                    {
                        model: models.storyEngagement,
                        as: 'storyEngagement',
                    },
                ],
            }
        );
        result.push(newStory.toJSON());
    }
    return result;
};
export default StoryFactory;
