import fleekStorage from '@fleekhq/fleek-storage-js';
import { AppMediaContent } from '@interfaces/app/appMediaContent';
import { Logger } from '@utils/logger';
import axios from 'axios';
import { Queue, Worker } from 'bullmq';
import sizeOf from 'image-size';
import { Op } from 'sequelize';
import sharp from 'sharp';

import config from '../../config';
import { models } from '../../database';
import { AWS } from './aws';

enum StorageCategory {
    communityCover,
    communityLogo,
    organizationLogo,
    story,
}

interface IJobThumbnail {
    category: StorageCategory;
    filenameNoExt: string;
    mediaContentId: number;
    pixelRatio: number;
    originalS3: AWS.S3.ManagedUpload.SendData;
}

export class ContentStorage {
    public appMediaContent = models.appMediaContent;
    public appMediaThumbnail = models.appMediaThumbnail;
    private queueThumbnail?: Queue<IJobThumbnail>;
    private queueThumbnailName = 'thumbnail';

    constructor() {
        if (process.env.NODE_ENV !== 'test') {
            this.queueThumbnail = new Queue<IJobThumbnail>(
                this.queueThumbnailName,
                {
                    connection: config.redis,
                }
            );
        }
    }

    listenToJobs() {
        if (process.env.NODE_ENV !== 'test') {
            const worker = new Worker<IJobThumbnail>(
                this.queueThumbnailName,
                (job) => this._createThumbnailFromJob(job.data),
                {
                    connection: config.redis,
                    // concurrency: config.bullJobsConcurrency,
                }
            );
            worker.on('failed', (job, err) =>
                Logger.error(`Failed job ${job.id} with ${err}`)
            );
        }
    }

    protected async _processAndUpload(
        file: Express.Multer.File,
        category: StorageCategory
    ) {
        // sharp the file
        const dimensions = sizeOf(file.buffer);
        let { height, width } = dimensions;
        let sharpBuffer: sharp.Sharp | undefined;

        if (
            file.mimetype.toLowerCase().indexOf('jpeg') === -1 ||
            file.mimetype.toLowerCase().indexOf('jpg') === -1
        ) {
            sharpBuffer = sharp(file.buffer);
            sharpBuffer = sharpBuffer.jpeg({
                quality: 100,
            });
        }
        // if height or width bigger than 8000, resize
        if (height && width && (height > 8000 || width > 8000)) {
            // undefined if for automatic resize
            // "Use null or undefined to auto-scale the height to match the width."
            const resizeSizes: { width?: number; height?: number } = {};
            if (sharpBuffer === undefined) {
                sharpBuffer = sharp(file.buffer);
            }
            // if height is bigger
            if (height > width && height > 8000) {
                resizeSizes.height = 8000;
            } else {
                resizeSizes.width = 8000;
            }
            sharpBuffer = sharpBuffer.resize({
                width: resizeSizes.width,
                height: resizeSizes.height,
            });
            const rDimensions = sizeOf(await sharpBuffer.toBuffer());
            width = rDimensions.width;
            height = rDimensions.height;
        }

        let imgBuffer: Buffer;
        if (sharpBuffer) {
            imgBuffer = await sharpBuffer.toBuffer();
        } else {
            imgBuffer = file.buffer;
        }

        const [filePath, filename] = this._generatedStorageFileName(category);
        const uploadResult = await this._uploadContentToS3(
            category,
            filePath,
            imgBuffer
        );

        const mediaContent = await this.appMediaContent.create({
            url: `${config.cloudfrontUrl}/${uploadResult.Key}`,
            width: width ? width : 0,
            height: height ? height : 0,
        });

        // add job to queue, return jobId and start async process
        // it's only undefined in NODE_ENV test
        const filenameNoExt = filename.split('.jp')[0];
        config.thumbnails.pixelRatio.forEach((pr) => {
            this.queueThumbnail!.add(
                'job',
                {
                    category,
                    filenameNoExt,
                    mediaContentId: mediaContent.id,
                    pixelRatio: pr,
                    originalS3: uploadResult,
                },
                { removeOnComplete: true, removeOnFail: 10 }
            );
        });

        return mediaContent;
    }

    protected _generatedStorageFileName(
        category: StorageCategory,
        thumbnail?: { width: number; height: number },
        pixelRatio?: number,
        filenameNoExt?: string
    ): string[] {
        // s3 recommends to use file prefix. Works like folders
        const now = new Date();
        let filePrefix = '';
        switch (category) {
            case StorageCategory.story:
                filePrefix = `${now.getDate()}/`;
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
        const filename = `${filenameNoExt ? filenameNoExt : now.getTime()}${
            pixelRatio && pixelRatio > 1 ? '@' + pixelRatio + 'x' : ''
        }.jpeg`;
        return [
            `${filePrefix}${
                thumbnail ? thumbnail.width + 'x' + thumbnail.height + '/' : ''
            }${filename}`,
            filename,
        ];
    }

    protected async _createThumbnailFromJob(jobData: IJobThumbnail) {
        let thumbnailSizes: { width: number; height: number }[];
        switch (jobData.category) {
            case StorageCategory.story:
                thumbnailSizes = config.thumbnails.story;
                break;
            case StorageCategory.communityCover:
                thumbnailSizes = config.thumbnails.community.cover;
                break;
            case StorageCategory.communityLogo:
                thumbnailSizes = config.thumbnails.community.logo;
                break;
            case StorageCategory.organizationLogo:
                thumbnailSizes = config.thumbnails.organization.logo;
                break;
        }

        const responseFromUrl = await axios.get(
            `${config.cloudfrontUrl}/${jobData.originalS3.Key}`,
            {
                responseType: 'arraybuffer',
            }
        );
        thumbnailSizes.forEach(async (thumbnailSize) => {
            const thumbnailBuffer = await sharp(
                Buffer.from(responseFromUrl.data, 'binary')
            )
                .resize({
                    width: thumbnailSize.width * jobData.pixelRatio,
                    height: thumbnailSize.height * jobData.pixelRatio,
                })
                .toBuffer();

            const [filePath] = this._generatedStorageFileName(
                jobData.category,
                thumbnailSize,
                jobData.pixelRatio,
                jobData.filenameNoExt
            );
            const thumbnailUploadResult = await this._uploadContentToS3(
                jobData.category,
                filePath,
                thumbnailBuffer
            );
            this.appMediaThumbnail.create({
                mediaContentId: jobData.mediaContentId,
                url: `${config.cloudfrontUrl}/${thumbnailUploadResult.Key}`,
                width: thumbnailSize.width,
                height: thumbnailSize.height,
                pixelRatio: jobData.pixelRatio,
            });
        });
    }

    protected _uploadContentToS3 = async (
        category: StorageCategory,
        filePath: string,
        fileBuffer: Buffer
    ): Promise<AWS.S3.ManagedUpload.SendData> => {
        const bucket = this._mapCategoryToBucket(category);
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

    protected async _awsQueryToDelete(path: string, category: StorageCategory) {
        const params: AWS.S3.DeleteObjectRequest = {
            Bucket: this._mapCategoryToBucket(category),
            Key: path.split(`${config.cloudfrontUrl}/`)[1],
        };
        //
        const s3 = new AWS.S3();
        await s3.deleteObject(params).promise();
    }

    protected async _findContentToDelete(mediaId: number) {
        const mediaResult = await this.appMediaContent.findOne({
            include: [
                {
                    model: this.appMediaThumbnail,
                    as: 'thumbnails',
                },
            ],
            where: { id: mediaId },
        });
        const media = mediaResult!.toJSON() as AppMediaContent;
        return [media.url, ...media.thumbnails!.map((t) => t.url)];
    }

    /**
     * @param filePath complete file url
     */
    protected async _deleteContentFromS3(
        filePath: string,
        category: StorageCategory
    ) {
        const contentResult = await this.appMediaContent.findOne({
            include: [
                {
                    model: this.appMediaThumbnail,
                    as: 'thumbnails',
                },
            ],
            where: { url: filePath },
        });
        if (contentResult) {
            const content = contentResult.toJSON() as AppMediaContent;
            content.thumbnails!.forEach((thumbnail) =>
                this._awsQueryToDelete(thumbnail.url, category)
            );
        }
        return false;
    }

    protected async _findBulkContentToDelete(mediaId: number[]) {
        const mediaResult = await this.appMediaContent.findOne({
            include: [
                {
                    model: this.appMediaThumbnail,
                    as: 'thumbnails',
                },
            ],
            where: { id: { [Op.in]: mediaId } },
        });
        const media = mediaResult!.toJSON() as AppMediaContent;
        return [media.url, ...media.thumbnails!.map((t) => t.url)];
    }

    /**
     * @param filePath complete file url
     */
    protected async _deleteBulkContentFromS3(
        filePath: string[],
        category: StorageCategory
    ) {
        const params: AWS.S3.DeleteObjectsRequest = {
            Bucket: this._mapCategoryToBucket(category),
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
    }

    protected _mapCategoryToBucket(category: StorageCategory) {
        if (category === StorageCategory.story) {
            return config.aws.bucket.story;
        } else if (
            category === StorageCategory.communityCover ||
            category === StorageCategory.communityLogo ||
            category === StorageCategory.organizationLogo
        ) {
            return config.aws.bucket.community;
        }
        throw new Error('invalid category');
    }
}

interface IContentStorage {
    uploadContent(file: Express.Multer.File): Promise<AppMediaContent>;
    deleteContent(mediaId: number): Promise<void>;
    deleteBulkContent(mediaId: number[]): Promise<void>;
}

export class StoryContentStorage
    extends ContentStorage
    implements IContentStorage {
    uploadContent(file: Express.Multer.File): Promise<AppMediaContent> {
        return this._processAndUpload(file, StorageCategory.story);
    }

    /**
     * This will delete thumbnails
     */
    async deleteContent(mediaId: number) {
        const filePaths = await this._findContentToDelete(mediaId);
        await this._deleteBulkContentFromS3(filePaths, StorageCategory.story);
        await this.appMediaContent.destroy({
            where: { id: mediaId },
        });
    }

    /**
     * This will delete thumbnails
     */
    async deleteBulkContent(mediaId: number[]) {
        const filePaths = await this._findBulkContentToDelete(mediaId);
        await this._deleteBulkContentFromS3(filePaths, StorageCategory.story);
        await this.appMediaContent.destroy({
            where: { id: { [Op.in]: mediaId } },
        });
    }
}

export class CommunityContentStorage
    extends ContentStorage
    implements IContentStorage {
    uploadContent(file: Express.Multer.File): Promise<AppMediaContent> {
        return this._processAndUpload(file, StorageCategory.communityCover);
    }

    /**
     * This will delete thumbnails
     */
    async deleteContent(mediaId: number) {
        const filePaths = await this._findContentToDelete(mediaId);
        await this._deleteBulkContentFromS3(
            filePaths,
            StorageCategory.communityCover
        );
        await this.appMediaContent.destroy({
            where: { id: mediaId },
        });
    }

    async deleteBulkContent(mediaId: number[]) {}
}

/**
 * @deprecated
 */
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

/**
 * @deprecated
 */
const uploadSingle = async (file: Express.Multer.File, bucket: string) => {
    const imgBuffer = await sharp(file.buffer)
        .jpeg({
            quality: 100,
        })
        .toBuffer();

    // content file
    const today = new Date();
    const filePrefix = `${today.getFullYear()}${today.getMonth() + 1}/`;
    const filename = `${Date.now().toString()}.jpeg`;
    const filePath = `${filePrefix}${filename}`;

    // upload to aws
    const uploadResult = await uploadContentToS3(bucket, filePath, imgBuffer);
    return `${config.cloudfrontUrl}/${uploadResult.Key}`;
};

/**
 * @deprecated
 */
const uploadCommunityPicture = async (
    to: string,
    file: Express.Multer.File
) => {
    let toBucket = config.aws.bucket.community;
    if (to === 'cover') {
        toBucket = config.aws.bucket.community;
    }
    return await uploadSingle(file, toBucket);
};

/**
 * @deprecated
 */
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
 * @deprecated
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
 * @deprecated
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
    uploadCommunityPicture,
    //
    sharpAndUpload,
    uploadContentToS3,
    deleteContentFromS3,
    deleteBulkContentFromS3,
};
