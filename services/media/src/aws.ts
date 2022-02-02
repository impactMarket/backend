import AWS from 'aws-sdk';

const aws = new AWS.Config({
    apiVersion: '2006-03-01',
    region: process.env.E_AWS_REGION,
    accessKeyId: process.env.E_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.E_AWS_SECRET_ACCESS_KEY,
});
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    region: process.env.E_AWS_REGION,
    accessKeyId: process.env.E_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.E_AWS_SECRET_ACCESS_KEY,
});

export { aws, AWS, s3 };
