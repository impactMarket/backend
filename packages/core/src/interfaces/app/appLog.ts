import { AppUser } from './appUser';

/**
 * @swagger
 *  components:
 *    schemas:
 *      AppLog:
 *        type: object
 *        required:
 *          - id
 *          - status
 *          - endBlock
 *        properties:
 *          id:
 *            type: integer
 *          status:
 *            type: integer
 *          endBlock:
 *            type: integer
 */

export enum LogTypes {
    EDITED_COMMUNITY = 'edited_community',
    EDITED_PROFILE = 'edited_profile'
}

export interface AppLog {
    id: number;
    userId: number;
    type: string;
    detail: object;
    communityId: number | null;

    // timestamp
    createdAt: Date;

    user?: AppUser;
}

export interface AppLogCreation {
    userId: number;
    type: string;
    detail: object;
    communityId?: number;
}
