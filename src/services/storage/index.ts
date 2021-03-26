import fleekStorage from '@fleekhq/fleek-storage-js';
import sharp from 'sharp';

import config from '../../config';
import { AWS } from './aws';

const sharpAndUpload = async (
    file: Express.Multer.File,
    category: string,
    includeFleek?: boolean
) => {
    // sharp the file
    const imgBuffer = await sharp(file.buffer)
        .resize({ width: 800 })
        .jpeg({
            quality:
                // if bigger than 3.5MB, reduce quality to 40%
                file.size > 3500000
                    ? 40
                    : // if bigger than 1.5MB, reduce quality to 60%
                    file.size > 1500000
                    ? 60
                    : // otherwise, reduce quality to 80%
                      80,
            chromaSubsampling: '4:4:4',
        })
        .toBuffer();

    // content file
    const today = new Date();
    const filePrefix = `${today.getFullYear()}${today.getMonth() + 1}/`;
    const filename = `${Date.now().toString()}.jpeg`;
    const filePath = `${filePrefix}${filename}`;

    // upload to aws
    const uploadResult = await uploadContentToS3(category, filePath, imgBuffer);
    // also upload to fleek storage (test phase)
    if (includeFleek) {
        fleekStorage.upload({
            apiKey: config.fleekStorage.accessKeyId,
            apiSecret: config.fleekStorage.secretAccessKey,
            key: `${category}/${filePath}`,
            data: imgBuffer,
        });
    }

    return uploadResult;
};

const uploadContentToS3 = async (
    category: string,
    filePath: string,
    fileBuffer: Buffer
): Promise<AWS.S3.ManagedUpload.SendData> => {
    const params: AWS.S3.PutObjectRequest = {
        Bucket: category,
        Key: filePath,
        Body: fileBuffer,
        ACL: 'public-read',
    };
    //
    const upload = new AWS.S3.ManagedUpload({ params });
    const uploadResult = await upload.promise();
    return uploadResult;
};

/**
 * @param filePath complete file url
 */
const deleteContentFromS3 = async (category: string, filePath: string) => {
    const params: AWS.S3.DeleteObjectRequest = {
        Bucket: category,
        Key: filePath.split(`${config.cloudfrontUrl}/`)[1],
    };
    //
    const s3 = new AWS.S3();
    await s3.deleteObject(params).promise();
    return true;
};

/**
 * @param filePath complete file url
 */
const deleteBulkContentFromS3 = async (
    category: string,
    filePath: string[]
) => {
    const params: AWS.S3.DeleteObjectsRequest = {
        Bucket: category,
        Delete: {
            Objects: filePath.map((f) => ({
                Key: f.split(`${config.cloudfrontUrl}/`)[1],
            })),
        },
    };
    //
    const s3 = new AWS.S3();
    await s3.deleteObjects(params).promise();
    return true;
};

export {
    sharpAndUpload,
    uploadContentToS3,
    deleteContentFromS3,
    deleteBulkContentFromS3,
};
