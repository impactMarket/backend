import { expect } from 'chai';
import { ethers } from 'ethers';
import { Sequelize } from 'sequelize';
import { replace, restore } from 'sinon';

import config from '../../../src/config';
import { models } from '../../../src/database';
import { LearnAndEarnCategoryModel } from '../../../src/database/models/learnAndEarn/learnAndEarnCategory';
import { LearnAndEarnLessonModel } from '../../../src/database/models/learnAndEarn/learnAndEarnLesson';
import { LearnAndEarnLevelModel } from '../../../src/database/models/learnAndEarn/learnAndEarnLevel';
import { LearnAndEarnQuizModel } from '../../../src/database/models/learnAndEarn/learnAndEarnQuiz';
import { AppUser } from '../../../src/interfaces/app/appUser';
import { answer } from '../../../src/services/learnAndEarn/answer';
import {
    listLessons,
    listLevels,
} from '../../../src/services/learnAndEarn/list';
import { startLesson } from '../../../src/services/learnAndEarn/start';
import { total } from '../../../src/services/learnAndEarn/userData';
import { sequelizeSetup, truncate } from '../../config/sequelizeSetup';
import UserFactory from '../../factories/user';

describe('Learn And Earn', () => {
    let sequelize: Sequelize;
    let users: AppUser[];
    let category: LearnAndEarnCategoryModel,
        level: LearnAndEarnLevelModel,
        lesson1: LearnAndEarnLessonModel,
        lesson2: LearnAndEarnLessonModel,
        lesson3: LearnAndEarnLessonModel,
        lesson4: LearnAndEarnLessonModel,
        // quiz1: LearnAndEarnQuizModel,
        // quiz2: LearnAndEarnQuizModel,
        quiz3: LearnAndEarnQuizModel,
        quiz4: LearnAndEarnQuizModel,
        quiz5: LearnAndEarnQuizModel,
        quiz6: LearnAndEarnQuizModel;

    before(async () => {
        sequelize = sequelizeSetup();
        await sequelize.sync();
        users = await UserFactory({ n: 1 });
        replace(
            config,
            'learnAndEarnPrivateKey',
            ethers.Wallet.createRandom().privateKey
        );

        // add category, level and lessons with pt language as user's default
        // language is pt
        // create category
        category = await models.learnAndEarnCategory.create({
            prismicId: 'category1',
            languages: ['pt'],
            active: true,
        });

        // create level
        level = await models.learnAndEarnLevel.create({
            active: true,
            categoryId: category.id,
            languages: ['pt'],
            prismicId: 'level1',
            totalReward: 500,
        });

        // create lesson
        lesson1 = await models.learnAndEarnLesson.create({
            active: true,
            levelId: level.id,
            languages: ['pt'],
            prismicId: 'lesson1',
        });
        lesson2 = await models.learnAndEarnLesson.create({
            active: true,
            levelId: level.id,
            languages: ['pt'],
            prismicId: 'lesson2',
        });
        lesson3 = await models.learnAndEarnLesson.create({
            active: true,
            levelId: level.id,
            languages: ['pt'],
            prismicId: 'lesson3',
        });
        lesson4 = await models.learnAndEarnLesson.create({
            active: true,
            levelId: level.id,
            languages: ['pt'],
            prismicId: 'lesson4',
        });

        // create quiz
        // quiz1 = await models.learnAndEarnQuiz.create({
        //     active: true,
        //     answer: 0,
        //     lessonId: lesson1.id,
        //     order: 0,
        // });
        // quiz2 = await models.learnAndEarnQuiz.create({
        //     active: true,
        //     answer: 1,
        //     lessonId: lesson1.id,
        //     order: 1,
        // });
        quiz3 = await models.learnAndEarnQuiz.create({
            active: true,
            answer: 0,
            lessonId: lesson2.id,
            order: 0,
        });
        quiz4 = await models.learnAndEarnQuiz.create({
            active: true,
            answer: 1,
            lessonId: lesson2.id,
            order: 1,
        });
        quiz5 = await models.learnAndEarnQuiz.create({
            active: true,
            answer: 1,
            lessonId: lesson3.id,
            order: 1,
        });
        quiz6 = await models.learnAndEarnQuiz.create({
            active: true,
            answer: 1,
            lessonId: lesson4.id,
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
            const total_ = await total(users[0].id);

            expect(total_.lesson).to.include({
                completed: 0,
                total: 2,
            });
            expect(total_.level).to.include({
                completed: 0,
                total: 1,
            });
            // expect(total.reward).to.include({
            //     received: 0,
            //     total: 500,
            // });
        });
    });

    describe('levels', () => {
        it('list levels available', async () => {
            const levels = await listLevels(
                users[0].id,
                config.defaultOffset,
                config.defaultLimit,
                'available'
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
            const levels = await listLevels(
                users[0].id,
                config.defaultOffset,
                config.defaultLimit,
                'completed'
            );

            expect(levels.count).to.be.eq(0);
        });
    });

    describe('lessons', () => {
        it('list lessons', async () => {
            const { lessons } = await listLessons(users[0].id, level.id);

            expect(lessons[0]).to.include({
                prismicId: 'lesson1',
                levelId: level.id,
                status: 'available',
            });
        });

        it('start a lesson', async () => {
            const start = await startLesson(users[0].id, lesson1.id);

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
            await startLesson(users[0].id, lesson2.id);
            const answer_ = await answer(
                { userId: users[0].id, address: users[0].address },
                [quiz3.answer, quiz4.answer],
                lesson2.id
            );

            expect(answer_).to.include({
                attempts: 1,
                success: true,
                points: 10,
            });
        });

        it('should return error when trying to conclude two lesson in a same day', async () => {
            await startLesson(users[0].id, lesson3.id);
            const answer_ = await answer(
                { userId: users[0].id, address: users[0].address },
                [quiz5.answer],
                lesson3.id
            );

            await startLesson(users[0].id, lesson4.id);
            answer(
                { userId: users[0].id, address: users[0].address },
                [quiz6.answer],
                lesson4.id
            )
                .catch((e) => expect(e.name).to.be.equal('LESSON_DAILY_LIMIT'))
                .then(() => {
                    throw new Error(
                        "'fails to answer a second question, expected to fail"
                    );
                });
        });
    });
});
