import { utils, database, subscriber } from '@impactmarket/core';


const subscriptionsChannel = 'subscriber-listener-status';
const redisPIDCondigVariable = '@subscriber/processId';

export function startSubscribers() {
    if (process.env.NODE_ENV === 'development') {
        return;
    }

    // this section considers two things. Many processes can run in parallel
    // but only one should be allowed to run the subscriber. Besides that
    // the api has a pre-start, which means, there can be two processes in parallel
    // and so once again, we want to prevent that from happening

    // if no process id is set, start the subscriber and set the process id
    database.redisClient.get(redisPIDCondigVariable).then((processId) => {
        if (processId === null) {
            subscriber.start();
            utils.Logger.info('⏱️ Chain Subscriber starting');
            database.redisClient.set(redisPIDCondigVariable, process.pid);
        }
    });

    // a single redis connection can't be used for everything
    // it's necessary to have a read/write connection
    // an event listener connection and an event publisher connection
    const redisListener = database.redisClient.duplicate();
    const redisPublisher = database.redisClient.duplicate();

    // so the program will not close instantly
    process.stdin.resume();

    // create an handler to be called the the app exits
    async function exitHandler(options: { exit?: boolean },) {
        if (options.exit) {
            database.redisClient.get(redisPIDCondigVariable).then((processId) => {
                if (processId && parseInt(processId, 10) === process.pid) {
                    utils.Logger.info('⏱️ Chain Subscriber stopping');
                    database.redisClient.del(redisPIDCondigVariable);
                    // emit the process being closed
                    redisPublisher.publish('subscriber-listener-status', process.pid.toString()).then(() => {
                        // eslint-disable-next-line no-process-exit
                        process.exit();
                    });
                } else {
                    // eslint-disable-next-line no-process-exit
                    process.exit();
                }
            });
        }
    }

    // catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, { exit: true }));
    // catches "kill pid" (for example: nodemon restart)
    process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
    process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

    redisListener.on('pmessage', (_, channel, msg) => {
        if (channel === subscriptionsChannel) {
            const processId = parseInt(msg, 10);
            if (processId !== process.pid) {
                subscriber.start();
                utils.Logger.info('⏱️ Chain Subscriber starting');
                database.redisClient.set(redisPIDCondigVariable, process.pid);
            }
        }

    });
}