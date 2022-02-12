import { QueryTypes, Op, literal } from 'sequelize';
import { Literal } from 'sequelize/types/lib/utils';
import { Logger } from '../../utils';

import { models, sequelize } from '../../database';
import { GlobalDemographics } from '../../database/models/global/globalDemographics';

export default class GlobalDemographicsService {
    public community = models.community;
    public ubiCommunityDemographics = models.ubiCommunityDemographics;
    public globalDemographics = models.globalDemographics;
    public sequelize = sequelize;

    public async get(): Promise<GlobalDemographics[]> {
        return await this.sequelize.query<GlobalDemographics>(
            `select * from globaldemographics where date = (select date from globaldemographics order by date desc limit 1)`,
            { type: QueryTypes.SELECT }
        );
    }

    public async calculate(): Promise<void> {
        try {
            const yesterdayDateOnly = new Date(new Date().getTime() - 86400000);
            yesterdayDateOnly.setHours(0, 0, 0, 0);

            const newDemographics = (await models.ubiCommunityDemographics.findAll({
                attributes: [
                    'community.country',
                    [literal(`'${yesterdayDateOnly}'`), 'date'],
                    [literal(`sum("ageRange1")`), 'ageRange1'],
                    [literal(`sum("ageRange2")`), 'ageRange2'],
                    [literal(`sum("ageRange3")`), 'ageRange3'],
                    [literal(`sum("ageRange4")`), 'ageRange4'],
                    [literal(`sum("ageRange5")`), 'ageRange5'],
                    [literal(`sum("ageRange6")`), 'ageRange6'],
                    [literal(`sum(male)`), 'male'],
                    [literal(`sum(female)`), 'female'],
                    [literal(`sum(undisclosed)`), 'undisclosed'],
                    [literal(`sum("totalGender")`), 'totalGender'],
                ],
                include: [{
                    attributes: [],
                    model: models.community,
                    as: 'community'
                }],
                where: {
                    date: {
                        [Op.eq]: literal(
                            `(select date from ubi_community_demographics order by date desc limit 1)`
                        ),
                    } as { [Op.eq]: Literal },
                },
                group: ['country'],
                raw: true
            })) as any;

            await this.globalDemographics.bulkCreate(newDemographics);
        } catch (error) {
            Logger.error('Failed to calculate globalDemographics: ', error)
        }
    }
}
