import { CommunityState } from '../db/models/communityState';
import { ICommunityState } from '../types';

export default class CommunityStateService {
    public static async add(communityId: string): Promise<ICommunityState> {
        return await CommunityState.create({
            communityId,
        });
    }

    public static async get(communityId: string): Promise<ICommunityState> {
        return (await CommunityState.findOne({
            attributes: ['claimed', 'raised', 'beneficiaries', 'backers'],
            where: { communityId },
        }))!;
    }
}
