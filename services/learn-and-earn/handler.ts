import { availableCourses, incompleteCourses } from './src/notification';
import { utils, config } from '@impactmarket/core';

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

export const notification = async (event, context) => {
    // notify users with incompleted courses
    try {
        await incompleteCourses();
        utils.Logger.info('Notified users with incomplete courses!');
    } catch (error) {
        utils.Logger.error('Error users with incomplete courses: ', error);
        utils.slack.sendSlackMessage('🚨 Error to notify users with incomplete courses', config.slack.lambdaChannel);
    }

    // notify when a new course is available
    try {
        await availableCourses();
        utils.Logger.info('Notified available courses and lessons!');
    } catch (error) {
        utils.Logger.error('Error notify available courses and lessons: ', error);
        utils.slack.sendSlackMessage('🚨 Error notify available courses and lessons', config.slack.lambdaChannel);
    }
};

notification(null, null)
