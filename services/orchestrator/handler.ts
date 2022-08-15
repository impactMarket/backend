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

        const herokuConfigVars = await getHerokuConfigVars(
            requestBody.data.app.id
        );
        const { REDIS_URL, DATABASE_URL } = herokuConfigVars;

        const listFunctions = await lambda.listFunctions().promise();
        listFunctions.Functions?.forEach(async (res) => {
            const config = await lambda
                .getFunctionConfiguration({ FunctionName: res.FunctionName! })
                .promise();
            await lambda
                .updateFunctionConfiguration({
                    FunctionName: res.FunctionName!,
                    Environment: {
                        Variables: {
                            ...config.Environment?.Variables,
                            REDIS_URL,
                            DATABASE_URL,
                        },
                    },
                })
                .promise();
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Env vars updated',
            }),
        };
    } catch (error) {
        console.log(error);
        return error;
    }
};
