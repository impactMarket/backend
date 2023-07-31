import { WebClient } from '@slack/web-api';
import config from '../config';

export function sendSlackMessage(text: string, channel: string) {
    const web = new WebClient(config.slack.token);
    web.chat.postMessage({ channel, text }).catch(console.error);
}
