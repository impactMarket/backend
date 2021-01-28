import AWS from 'aws-sdk';

import config from '../../../config';

const aws = new AWS.Config({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.region,
    //
    apiVersion: '2006-03-01',
});

export {
    aws,
    AWS,
}