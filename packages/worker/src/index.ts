import 'module-alias/register';
import jobsLoader from './jobs';
import {
    communitySubscription,
    userActivitySubscription,
} from './subscription';

jobsLoader();
communitySubscription();
userActivitySubscription();
