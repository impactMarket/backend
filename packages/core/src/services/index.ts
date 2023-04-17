import * as app from './app';
import Email from './email';
import * as global from './global';
import { answer } from './learnAndEarn/answer';
import { registerClaimRewards } from './learnAndEarn/claimRewards';
import { listLessons, listLevels } from './learnAndEarn/list';
import { startLesson } from './learnAndEarn/start';
import { webhook } from './learnAndEarn/syncRemote';
import { total } from './learnAndEarn/userData';
import MicrocreditService from './microcredit';
import * as storage from './storage';
import StoryServiceV2 from './story/index';
import * as ubi from './ubi';

const learnAndEarn = {
    answer,
    registerClaimRewards,
    listLessons,
    listLevels,
    startLesson,
    webhook,
    total,
};
export {
    app,
    global,
    storage,
    ubi,
    Email,
    StoryServiceV2,
    learnAndEarn,
    MicrocreditService,
};
