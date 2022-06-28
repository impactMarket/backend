import { StoryContent } from './storyContent';

/**
 * @swagger
 *  components:
 *    schemas:
 *      StoryMedia:
 *        type: object
 *        required:
 *          - id
 *          - contentId
 *          - storyMediaPath
 *        properties:
 *          id:
 *            type: integer
 *          contentId:
 *            type: integer
 *          storyMediaPath:
 *            type: string
 */
export interface StoryMedia {
    id: number;
    contentId: number;
    storyMediaPath: string;

    storyContent?: StoryContent;
}

export interface StoryMediaCreation {
    contentId: number;
    storyMediaPath: string;
}

export interface StoryMediaCreationEager {
    storyMediaPath: string;
}
