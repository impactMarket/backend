import { CommunityAttributes } from '../ubi/community';
import { StoryContent } from './storyContent';

/**
 * @swagger
 *  components:
 *    schemas:
 *      StoryCommunity:
 *        type: object
 *        required:
 *          - id
 *          - contentId
 *          - communityId
 *        properties:
 *          id:
 *            type: integer
 *          contentId:
 *            type: integer
 *          communityId:
 *            type: integer
 */
export interface StoryCommunity {
    id: number;
    contentId: number;
    communityId: number;

    community?: CommunityAttributes;
    storyContent?: StoryContent;
}

export interface StoryCommunityCreation {
    contentId: number;
    communityId: number;
}
export interface StoryCommunityCreationEager {
    communityId: number;
}
