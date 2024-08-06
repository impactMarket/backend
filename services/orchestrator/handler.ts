import AWS from 'aws-sdk';
import axios from 'axios';

const lambda = new AWS.Lambda();
const API_KEY = process.env.API_KEY;
const HEROKU_URL = process.env.HEROKU_URL;

const getHerokuConfigVars = async (appId: string) => {
    const response = await axios.get(
        `${HEROKU_URL}/apps/${appId}/config-vars`,
        {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                Accept: 'application/vnd.heroku+json; version=3',
            },
        }
    );
    return response.data;
};

export const herokuTrigger = async (event: any, context: any) => {
    try {
        const requestBody = JSON.parse(event.body);
        console.log(requestBody);
        const projectName = requestBody.data.app.name;
        const stage = process.env.STAGE;

        const herokuConfigVars = await getHerokuConfigVars(projectName);
        const { REDIS_URL, DATABASE_URL } = herokuConfigVars;

        const listFunctions = await lambda.listFunctions().promise();
        const promises = listFunctions.Functions?.map(async (res) => {
            const tags = await lambda
                .listTags({ Resource: res.FunctionArn! })
                .promise();

            if (tags.Tags && tags.Tags.STAGE === stage) {
                console.log('updating: ', res.FunctionName);
                const config = await lambda.getFunctionConfiguration({
                    FunctionName: res.FunctionName!,
                }).promise();
                if (config.LastUpdateStatus !== 'InProgress') {
                    return lambda
                        .updateFunctionConfiguration({
                            FunctionName: res.FunctionName!,
                            Environment: {
                                Variables: {
                                    ...res.Environment?.Variables,
                                    REDIS_URL,
                                    DATABASE_URL,
                                },
                            },
                        })
                        .promise();
                }
            }
        });

        await Promise.all(promises!);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Env vars updated',
            }),
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};
