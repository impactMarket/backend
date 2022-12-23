import { answer } from './answer';
import { registerClaimRewards } from './claimRewards';
import { listLessons, listLevels } from './list';
import { startLesson } from './start';
import { webhook } from './syncRemote';
import { total } from './userData';

export default class LearnAndEarnService {
    public total = total;

    public startLesson = startLesson;

    public registerClaimRewards = registerClaimRewards;

    public answer = answer;

    public listLevels = listLevels;

    public listLessons = listLessons;

    public webhook = webhook;
}
