import { S3 } from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import config from '../config';


const s3 = new S3({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.region,
});

// Initialize multers3 with our s3 config and other options
export const upload = multer({
    storage: multerS3({
        s3: (s3 as any),
        bucket: config.aws.picturesBucket,
        acl: 'public-read',
        metadata(req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key(req, file, cb) {
            cb(null, Date.now().toString() + path.extname(file.originalname));
        }
    })
})