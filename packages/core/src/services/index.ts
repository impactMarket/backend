import * as app from './app';
import Email from './email';
import * as global from './global';
import { answer } from './learnAndEarn/answer';
import { registerClaimRewards } from './learnAndEarn/claimRewards';
import { listLessons, listLevels } from './learnAndEarn/list';
import { startLesson } from './learnAndEarn/start';
import { webhook } from './learnAndEarn/syncRemote';
import { total } from './learnAndEarn/userData';
import * as media from './media';
import ReachedAddressService from './reachedAddress';
import * as storage from './storage';
import StoryService from './story';
import StoryServiceV2 from './story/index';
import MicrocreditService from './microcredit';
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
    media,
    ReachedAddressService,
    StoryService,
    StoryServiceV2,
    learnAndEarn,
    MicrocreditService,
};
