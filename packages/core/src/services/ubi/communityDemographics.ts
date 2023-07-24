import { QueryTypes } from 'sequelize';

import { UbiCommunityDemographics } from '../../interfaces/ubi/ubiCommunityDemographics';
import { models, sequelize } from '../../database';

export default class CommunityDemographicsService {
    public community = models.community;
    public ubiCommunityDemographics = models.ubiCommunityDemographics;
    public sequelize = sequelize;

    public async get(): Promise<UbiCommunityDemographics[]> {
        return await this.sequelize.query<UbiCommunityDemographics>(
            `select * from ubi_community_demographics where date = (select date from ubi_community_demographics order by date desc limit 1)`,
            { type: QueryTypes.SELECT }
        );
    }

    public async calculate(): Promise<void> {
        // TODO: needs refactoring
    }
}
