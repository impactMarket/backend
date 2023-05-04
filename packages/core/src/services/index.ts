import * as app from './app';
import Email from './email';
import * as global from './global';
import { answer } from './learnAndEarn/answer';
import { registerClaimRewards } from './learnAndEarn/claimRewards';
import {
    listLessons,
    listLevels,
    listLevelsByAdmin,
} from './learnAndEarn/list';
import { startLesson } from './learnAndEarn/start';
import { webhook } from './learnAndEarn/syncRemote';
import { total } from './learnAndEarn/userData';
import { createLevel } from './learnAndEarn/create';
import Protocol from './protocol';
import * as MicroCredit from './microcredit';
import * as storage from './storage';
import StoryServiceV2 from './story/index';
import * as ubi from './ubi';

const learnAndEarn = {
    answer,
    registerClaimRewards,
    listLessons,
    listLevels,
    listLevelsByAdmin,
    startLesson,
    webhook,
    total,
    createLevel,
};
export {
    app,
    global,
    storage,
    ubi,
    Email,
    StoryServiceV2,
    learnAndEarn,
    MicroCredit,
    Protocol,
};
