import { QueryTypes } from 'sequelize';
import {
    GlobalDemographics,
    GlobalDemographicsCreationAttributes
} from '@models/globalDemographics';
import database from '../loaders/database';

const db = database();
export default class GlobalDemographicsService {

    public static async add(demographics: GlobalDemographicsCreationAttributes): Promise<GlobalDemographics> {
        return await db.models.globalDemographics.create(demographics);
    }

    public static async getLast(): Promise<GlobalDemographics> {
        return (await db.sequelize.query<GlobalDemographics>(`select * from globaldemographics where date = (select date from globaldemographics order by date desc limit 1)`, { type: QueryTypes.SELECT }))[0];
    }

    public static async calculateDemographics(): Promise<void> {
        const yesterdayDateOnly = new Date(new Date().getTime() - 86400000);
        yesterdayDateOnly.setHours(0, 0, 0, 0);

        const newDemographics: GlobalDemographicsCreationAttributes[] = [];

        const sqlAgeRangeQuery = `WITH current_date_year (current_year) as (
            values (EXTRACT(YEAR from now()))
         )
         select c.country
              , count(*) FILTER (WHERE current_year-u.year BETWEEN 18 AND 24) AS ageRange1
              , count(*) FILTER (WHERE current_year-u.year BETWEEN 25 AND 34) AS ageRange2
              , count(*) FILTER (WHERE current_year-u.year BETWEEN 35 AND 44) AS ageRange3
              , count(*) FILTER (WHERE current_year-u.year BETWEEN 45 AND 54) AS ageRange4
              , count(*) FILTER (WHERE current_year-u.year BETWEEN 55 AND 64) AS ageRange5
              , count(*) FILTER (WHERE current_year-u.year BETWEEN 65 AND 120) AS ageRange6
         from "user" u, "current_date_year", beneficiary b, community c
         where u.address = b.address
         and b."communityId" = c."publicId"
         and c.visibility = 'public'
         and c.status = 'valid'
         group by c.country`;

        const sqlGenderQuery = `select u.gender, count(u.gender) total, c.country
        from "user" u, beneficiary b, community c
        where (u.gender = 'f' or u.gender = 'm')
        and u.address = b.address
        and b."communityId" = c."publicId"
        group by c.country, u.gender
        order by c.country`;

        // query data
        const ageRange = await db.sequelize.query<{
            country: string,
            ageRange1: number,
            ageRange2: number,
            ageRange3: number,
            ageRange4: number,
            ageRange5: number,
            ageRange6: number
        }>(sqlAgeRangeQuery, { type: QueryTypes.SELECT });
        const rawGender = await db.sequelize.query<{
            gender: string,
            total: number,
            country: string
        }>(sqlGenderQuery, { type: QueryTypes.SELECT });

        // format gender results for easier write
        const gender = new Map<string, { male: number, female: number }>();

        for (let g = 0; g < rawGender.length; g++) {
            const element = rawGender[g];

            let previous = gender.get(element.country);
            if (previous === undefined) {
                previous = { male: 0, female: 0 };
            }
            if (element.gender === 'f') {
                gender.set(element.country, {
                    ...previous,
                    female: element.total,
                });
            } else if (element.gender === 'm') {
                gender.set(element.country, {
                    ...previous,
                    male: element.total,
                });
            }
        }

        for (let a = 0; a < ageRange.length; a++) {
            const element = ageRange[a];
            newDemographics.push({
                date: yesterdayDateOnly,
                ...element,
                ...gender.get(element.country)!
            });
        }

        await db.models.globalDemographics.bulkCreate(newDemographics);
    }
}
