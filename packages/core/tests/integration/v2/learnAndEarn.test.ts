import { expect } from 'chai';
import { ethers } from 'ethers';
import { Sequelize } from 'sequelize';
import { replace, stub, SinonStub, restore } from 'sinon';

import config from '../../../src/config';
import { models, sequelize as database } from '../../../src/database';
import { LearnAndEarnCategoryModel } from '../../../src/database/models/learnAndEarn/learnAndEarnCategory';
import { LearnAndEarnLessonModel } from '../../../src/database/models/learnAndEarn/learnAndEarnLesson';
import { LearnAndEarnLevelModel } from '../../../src/database/models/learnAndEarn/learnAndEarnLevel';
import { LearnAndEarnQuizModel } from '../../../src/database/models/learnAndEarn/learnAndEarnQuiz';
import { AppUser } from '../../../src/interfaces/app/appUser';
import LearnAndEarnService from '../../../src/services/learnAndEarn';
import { sequelizeSetup, truncate } from '../../config/sequelizeSetup';
import UserFactory from '../../factories/user';

describe('Learn And Earn', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let category: LearnAndEarnCategoryModel,
        level: LearnAndEarnLevelModel,
        lesson1: LearnAndEarnLessonModel,
        lesson2: LearnAndEarnLessonModel,
        quiz1: LearnAndEarnQuizModel,
        quiz2: LearnAndEarnQuizModel,
        quiz3: LearnAndEarnQuizModel,
        quiz4: LearnAndEarnQuizModel;

    const learnAndEarnService = new LearnAndEarnService();

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();
        users = await UserFactory({ n: 1 });

        // create category
        category = await models.learnAndEarnCategory.create({
            prismicId: 'category1',
            active: true,
        });

        // create level
        level = await models.learnAndEarnLevel.create({
            active: true,
            categoryId: category.id,
            prismicId: 'level1',
            totalReward: 500,
        });

        // create lesson
        lesson1 = await models.learnAndEarnLesson.create({
            active: true,
            levelId: level.id,
            prismicId: 'lesson1',
        });
        lesson2 = await models.learnAndEarnLesson.create({
            active: true,
            levelId: level.id,
            prismicId: 'lesson2',
        });

        // create quiz
        quiz1 = await models.learnAndEarnQuiz.create({
            active: true,
            answerId: 'answer1',
            lessonId: lesson1.id,
            order: 0,
        });
        quiz2 = await models.learnAndEarnQuiz.create({
            active: true,
            answerId: 'answer2',
            lessonId: lesson1.id,
            order: 1,
        });
        quiz3 = await models.learnAndEarnQuiz.create({
            active: true,
            answerId: 'answer1',
            lessonId: lesson2.id,
            order: 0,
        });
        quiz4 = await models.learnAndEarnQuiz.create({
            active: true,
            answerId: 'answer2',
            lessonId: lesson2.id,
            order: 1,
        });
    });

    after(async () => {
        await truncate(sequelize, 'LearnAndEarnCategoryModel');
        await truncate(sequelize, 'LearnAndEarnLevelModel');
        await truncate(sequelize, 'LearnAndEarnLessonModel');
        await truncate(sequelize, 'LearnAndEarnQuizModel');
        await truncate(sequelize, 'LearnAndEarnPaymentModel');
        await truncate(sequelize, 'LearnAndEarnUserCategoryModel');
        await truncate(sequelize, 'LearnAndEarnUserLevelModel');
        await truncate(sequelize, 'LearnAndEarnUserLessonModel');
        await truncate(sequelize, 'AppUserModel');
        await truncate(sequelize);
        restore();
    });

    describe('total', () => {
        it('get total', async () => {
            const total = await learnAndEarnService.total(users[0].id);

            expect(total.lesson).to.include({
                completed: 0,
                total: 2,
            });
            expect(total.level).to.include({
                completed: 0,
                total: 1,
            });
            expect(total.reward).to.include({
                received: 0,
                total: 500,
            });
        });
    });

    describe('levels', () => {
        it('list levels available', async () => {
            const levels = await learnAndEarnService.listLevels(
                users[0].id,
                'available',
                config.defaultOffset,
                config.defaultLimit
            );

            expect(levels.count).to.be.eq(1);
            expect(levels.rows[0]).to.include({
                prismicId: 'level1',
                totalReward: 500,
                status: 'available',
                totalLessons: 2,
            });
        });

        it('list levels completed', async () => {
            const levels = await learnAndEarnService.listLevels(
                users[0].id,
                'completed',
                config.defaultOffset,
                config.defaultLimit
            );

            expect(levels.count).to.be.eq(0);
        });
    });

    describe('lessons', () => {
        it('list lessons', async () => {
            const lessons = await learnAndEarnService.listLessons(
                users[0].id,
                level.id
            );

            expect(lessons[0]).to.include({
                prismicId: 'lesson1',
                levelId: level.id,
                status: 'available',
            });
        });

        it('start a lesson', async () => {
            const start = await learnAndEarnService.startLesson(
                users[0].id,
                lesson1.id
            );

            expect(start.lesson).to.include({
                userId: users[0].id,
                lessonId: lesson1.id,
                status: 'started',
                attempts: 0,
            });
        });
    });

    describe('answers', () => {
        it('check answers', async () => {
            await learnAndEarnService.startLesson(users[0].id, lesson2.id);
            const answer = await learnAndEarnService.answer(
                users[0].id,
                [quiz3.answerId, quiz4.answerId],
                lesson2.id
            );

            expect(answer).to.include({
                attempts: 1,
                success: true,
                points: 10,
            });
        });
    });
});
