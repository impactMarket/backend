import fleekStorage from '@fleekhq/fleek-storage-js';
import sizeOf from 'image-size';
import sharp from 'sharp';

import config from '../../config';
import { AWS } from './aws';

enum StorageCategory {
    communityCover,
    communityLogo,
    organizationLogo,
    story,
}

class ContentStorage {
    async processAndUpload(
        file: Express.Multer.File,
        category: StorageCategory
    ) {
        //

        // sharp the file
        const dimensions = sizeOf(file.buffer);
        let sharpBuffer: sharp.Sharp | undefined;

        if (
            file.mimetype.toLowerCase().indexOf('jpg') === -1 &&
            file.mimetype.toLowerCase().indexOf('jpeg')
        ) {
            sharpBuffer = sharp(file.buffer);
            sharpBuffer = sharpBuffer.jpeg({
                quality: 100,
            });
        }
        //
        if (
            (dimensions.height && dimensions.height > 8000) ||
            (dimensions.width && dimensions.width > 8000)
        ) {
            if (sharpBuffer === undefined) {
                sharpBuffer = sharp(file.buffer);
            }
            sharpBuffer = sharpBuffer.resize({ width: 8000, height: 8000 });
        }

        let imgBuffer: Buffer;
        if (sharpBuffer) {
            imgBuffer = await sharpBuffer.toBuffer();
        } else {
            imgBuffer = file.buffer;
        }

        const filePath = this._generatedStorageFileName(category);
        const uploadResult = await this._uploadContentToS3(
            category,
            filePath,
            imgBuffer
        );

        // TODO: add job to queue, return jobId and start async process

        return uploadResult;
    }

    createThumbnail() {
        //
    }

    _generatedStorageFileName(
        category: StorageCategory,
        thumbnail?: { width: number; height: number }
    ): string {
        // s3 recommends to use file prefix. Works like folders
        const now = new Date();
        let filePrefix = '';
        switch (category) {
            case StorageCategory.story:
                filePrefix = `${now.getDay()}/`;
                break;
            case StorageCategory.communityCover:
                filePrefix = 'cover/';
                break;
            case StorageCategory.communityLogo:
                filePrefix = 'logo/';
                break;
            case StorageCategory.organizationLogo:
                filePrefix = 'org-logo/';
                break;
        }
        return `${filePrefix}${
            thumbnail ? thumbnail.width + 'x' + thumbnail.height + '/' : ''
        }${now.toString()}.jpeg`;
    }

    _uploadContentToS3 = async (
        category: StorageCategory,
        filePath: string,
        fileBuffer: Buffer
    ): Promise<AWS.S3.ManagedUpload.SendData> => {
        let bucket = '';
        if (category === StorageCategory.story) {
            bucket = config.aws.bucket.story;
        } else if (
            category === StorageCategory.communityCover ||
            category === StorageCategory.communityLogo ||
            category === StorageCategory.organizationLogo
        ) {
            bucket = config.aws.bucket.community;
        }

        const params: AWS.S3.PutObjectRequest = {
            Bucket: bucket,
            Key: filePath,
            Body: fileBuffer,
            ACL: 'public-read',
        };
        //
        const upload = new AWS.S3.ManagedUpload({ params });
        const uploadResult = await upload.promise();
        return uploadResult;
    };
}

const sharpThumbnail = async (
    sharp: sharp.Sharp,
    category: string,
    width: number,
    height: number
) => {
    const imgBuffer = sharp.resize({ width, height }).toBuffer();
};

const sharpAndUpload = async (
    file: Express.Multer.File,
    category: string,
    includeFleek?: boolean
) => {
    // sharp the file
    const dimensions = sizeOf(file.buffer);
    let sharpBuffer = sharp(file.buffer);

    if (
        file.mimetype.toLowerCase().indexOf('jpg') === -1 &&
        file.mimetype.toLowerCase().indexOf('jpeg')
    ) {
        sharpBuffer = sharpBuffer.jpeg({
            quality: 100,
        });
    }
    //
    if (
        (dimensions.height && dimensions.height > 2000) ||
        (dimensions.width && dimensions.width > 2000)
    ) {
        sharpBuffer = sharpBuffer.resize({ width: 2000, height: 2000 });
    }

    const imgBuffer = await sharpBuffer.toBuffer();

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
