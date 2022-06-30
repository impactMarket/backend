import { CommunityAttributes } from '../ubi/community';
import { StoryContent } from './storyContent';

/**
 * @swagger
 *  components:
 *    schemas:
 *      StoryComment:
 *        type: object
 *        required:
 *          - id
 *          - contentId
 *          - comment
 *        properties:
 *          id:
 *            type: integer
 *          contentId:
 *            type: integer
 *          comment:
 *            type: string
 */
export interface StoryComment {
    id: number;
    contentId: number;
    comment: string;
    userId: number;

    // timestamps
    createdAt: Date;
    updatedAt: Date;

    storyContent?: StoryContent;
}

export interface StoryCommentCreation {
    contentId: number;
    comment: string;
    userId: number;
}
