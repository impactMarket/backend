import { S3 } from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';


const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "eu-west-3",
});

// Initialize multers3 with our s3 config and other options
export const upload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.AWS_BUCKET!,
        acl: 'public-read',
        metadata(req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key(req, file, cb) {
            cb(null, Date.now().toString() + '.png');
        }
    })
})