import { literal, QueryTypes } from 'sequelize';

import { models, sequelize } from '../../database';
import { UbiCommunityDemographicsCreation, UbiCommunityDemographics } from '../../interfaces/ubi/ubiCommunityDemographics';

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
        const yesterdayDateOnly = new Date();
        yesterdayDateOnly.setDate(yesterdayDateOnly.getDate() - 1);
        const yesterdayDate = yesterdayDateOnly.toISOString().split('T')[0];

        const year = new Date().getUTCFullYear();
        const demographics: UbiCommunityDemographicsCreation[] =
            (await this.community.findAll({
                attributes: [
                    ['id', 'communityId'],
                    [literal(`'${yesterdayDate}'`), 'date'],
                    [
                        literal(
                            `count(*) FILTER (WHERE ${year}-"beneficiaries->user".year BETWEEN 18 AND 24)`
                        ),
                        'ageRange1',
                    ],
                    [
                        literal(
                            `count(*) FILTER (WHERE ${year}-"beneficiaries->user".year BETWEEN 25 AND 34)`
                        ),
                        'ageRange2',
                    ],
                    [
                        literal(
                            `count(*) FILTER (WHERE ${year}-"beneficiaries->user".year BETWEEN 35 AND 44)`
                        ),
                        'ageRange3',
                    ],
                    [
                        literal(
                            `count(*) FILTER (WHERE ${year}-"beneficiaries->user".year BETWEEN 45 AND 54)`
                        ),
                        'ageRange4',
                    ],
                    [
                        literal(
                            `count(*) FILTER (WHERE ${year}-"beneficiaries->user".year BETWEEN 55 AND 64)`
                        ),
                        'ageRange5',
                    ],
                    [
                        literal(
                            `count(*) FILTER (WHERE ${year}-"beneficiaries->user".year BETWEEN 65 AND 120)`
                        ),
                        'ageRange6',
                    ],
                    [
                        literal(
                            'count(*) FILTER (WHERE "beneficiaries->user".gender = \'m\')'
                        ),
                        'male',
                    ],
                    [
                        literal(
                            'count(*) FILTER (WHERE "beneficiaries->user".gender = \'f\')'
                        ),
                        'female',
                    ],
                    [
                        literal(
                            'count(*) FILTER (WHERE "beneficiaries->user".gender = \'u\'  OR "beneficiaries->user".gender is null)'
                        ),
                        'undisclosed',
                    ],
                    [literal('count(*)'), 'totalGender'],
                ],
                include: [
                    {
                        model: models.beneficiary,
                        as: 'beneficiaries',
                        attributes: [],
                        where: {
                            active: true,
                        },
                        include: [
                            {
                                model: models.appUser,
                                as: 'user',
                                required: false,
                                attributes: [],
                            },
                        ],
                    },
                ],
                where: {
                    visibility: 'public',
                    status: 'valid',
                },
                group: ['"Community".id'],
                raw: true,
            })) as any;

        await this.ubiCommunityDemographics.bulkCreate(demographics);
    }
}