import {
    Router,
} from 'express';
import aws from 'aws-sdk';
import Logger from '../loaders/logger';
import config from '../config';

const route = Router();

aws.config.update({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.region,
});
const s3 = new aws.S3();

export default (app: Router): void => {
    app.use('/mobile-logs', route);

    route.post('/', (req, res) => {
        const params = {
            ACL: 'public-read',
            Bucket: config.aws.bucketLogs,
            Body: Buffer.from(req.body.logs),
            Key: Date.now() + Math.random() + '.txt'
        };
        s3.upload(params, (err, data) => {
            if (err) {
                Logger.error('Error occured while trying to upload to S3 bucket', err);
                res.sendStatus(400);
            }
            if (data) {
                res.sendStatus(200);
            }
        });
    });
};