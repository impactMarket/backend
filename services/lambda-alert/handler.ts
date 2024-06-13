import { WebClient } from '@slack/web-api';

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

const sendSlackMessage = async (lambda: string) => {
    const web = new WebClient(SLACK_TOKEN);
    await web.chat.postMessage({ channel: SLACK_CHANNEL!, text: '🚨 Error to run lambda: ' + lambda }).catch(console.error);
}

export const notify = async (event: any, context: any) => {
    try {
        console.log(JSON.stringify(event))
        if (event.Records[0]?.Sns?.Message) {
            const message = JSON.parse(event.Records[0].Sns.Message);
            const lambda = message.Trigger.Dimensions[0].value;

            await sendSlackMessage(lambda);
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};
