import {
    Router,
} from 'express';
import aws from 'aws-sdk';
import Logger from '../loaders/logger';

const route = Router();

aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "eu-west-3",
});
const s3 = new aws.S3();

export default (app: Router): void => {
    app.use('/mobile', route);

    route.post('/logs', (req, res) => {
        const params = {
            ACL: 'public-read',
            Bucket: process.env.AWS_BUKET_LOGS!,
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

    route.get('/version', (req, res) => {
        res.send({
            latest: process.env.LATEST_MOBILE_APP_VERSION,
            minimal: process.env.MINIMAL_MOBILE_APP_VERSION
        });
    });
};