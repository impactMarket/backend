import { Op } from 'sequelize';

import config from '../../config';
import { models } from '../../database';
import { AppMediaContent } from '../../interfaces/app/appMediaContent';
import { AWS } from './aws';

enum StorageCategory {
    communityCover,
    promoterLogo,
    story,
    profile,
}
export class ContentStorage {
    public appMediaContent = models.appMediaContent;
    public appMediaThumbnail = models.appMediaThumbnail;

    protected _generatedStorageFileName(
        category: StorageCategory,
        mimetype: string,
        thumbnail?: { width: number; height: number },
        pixelRatio?: number,
        filenameNoExt?: string
    ): string[] {
        // s3 recommends to use file prefix. Works like folders
        const now = new Date();
        let filePrefix = '';
        switch (category) {
            case StorageCategory.story:
                filePrefix = `story/${now.getDate()}/`;
                break;
            case StorageCategory.communityCover:
                filePrefix = 'cover/';
                break;
            case StorageCategory.promoterLogo:
                filePrefix = 'org-logo/';
                break;
            case StorageCategory.profile:
                filePrefix = 'avatar/';
                break;
        }
        const filename = `${filenameNoExt ? filenameNoExt : now.getTime()}${
            pixelRatio && pixelRatio > 1 ? '@' + pixelRatio + 'x' : ''
        }${mimetype.length > 0 ? mimetype : '.jpeg'}`;
        return [
            `${filePrefix}${
                thumbnail ? thumbnail.width + 'x' + thumbnail.height + '/' : ''
            }${filename}`,
            filename,
        ];
    }

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
        } else if (category === StorageCategory.profile) {
            return config.aws.bucket.profile;
        } else if (
            category === StorageCategory.communityCover ||
            category === StorageCategory.promoterLogo
        ) {
            return config.aws.bucket.community;
        }
        throw new Error('invalid category');
    }

    protected async _getPresignedUrlPutObject(
        mime: string,
        category: StorageCategory
    ) {
        // jpg or jpe are not a mimetype
        if (mime === 'jpg' || mime === 'jpe') {
            mime = 'jpeg';
        }
        const [filePath, filename] = this._generatedStorageFileName(
            category,
            `.${mime}`
        );
        const params: AWS.S3.PutObjectRequest = {
            Bucket: config.aws.bucket.temporary,
            Key: filePath,
            ACL: 'public-read',
            ContentType: 'image/' + mime,
        };
        const s3 = new AWS.S3();
        const uploadURL = await s3.getSignedUrlPromise('putObject', params);
        const mediaContent = await this.appMediaContent.create({
            url: `${config.cloudfrontUrl}/${filePath.replace(
                `.${mime}`,
                '.jpeg'
            )}`,
            width: 0, // updated later
            height: 0, // updated later
        });
        return { uploadURL, filename, media: mediaContent };
    }
}

interface IContentStorage {
    getPresignedUrlPutObject(mime: string): Promise<{
        uploadURL: string;
        filename: string;
    }>;
    deleteContent(mediaId: number): Promise<void>;
    deleteBulkContent(mediaId: number[]): Promise<void>;
}

export class StoryContentStorage
    extends ContentStorage
    implements IContentStorage
{
    getPresignedUrlPutObject(mime: string): Promise<{
        uploadURL: string;
        filename: string;
    }> {
        return this._getPresignedUrlPutObject(mime, StorageCategory.story);
    }

    /**
     * This will delete thumbnails
     */
    async deleteContent(mediaId: number) {
        const filePaths = await this._findContentToDelete(mediaId);
        await this._deleteBulkContentFromS3(filePaths, StorageCategory.story);
        // TODO:
        try {
            await this.appMediaContent.destroy({
                where: { id: mediaId },
            });
        } catch (e) {}
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
    implements IContentStorage
{
    getPresignedUrlPutObject(mime: string): Promise<{
        uploadURL: string;
        filename: string;
    }> {
        return this._getPresignedUrlPutObject(
            mime,
            StorageCategory.communityCover
        );
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

    async deleteBulkContent(mediaId: number[]) {
        // To be compliant with interface
    }
}

export class PromoterContentStorage
    extends ContentStorage
    implements IContentStorage
{
    getPresignedUrlPutObject(mime: string): Promise<{
        uploadURL: string;
        filename: string;
    }> {
        return this._getPresignedUrlPutObject(
            mime,
            StorageCategory.promoterLogo
        );
    }

    /**
     * This will delete thumbnails
     */
    async deleteContent(mediaId: number) {
        const filePaths = await this._findContentToDelete(mediaId);
        await this._deleteBulkContentFromS3(
            filePaths,
            StorageCategory.promoterLogo
        );
        await this.appMediaContent.destroy({
            where: { id: mediaId },
        });
    }

    async deleteBulkContent(mediaId: number[]) {
        // To be compliant with interface
    }
}

export class ProfileContentStorage
    extends ContentStorage
    implements IContentStorage
{
    getPresignedUrlPutObject(mime: string): Promise<{
        uploadURL: string;
        filename: string;
    }> {
        return this._getPresignedUrlPutObject(mime, StorageCategory.profile);
    }

    /**
     * This will delete thumbnails
     */
    async deleteContent(mediaId: number) {
        const filePaths = await this._findContentToDelete(mediaId);
        await this._deleteBulkContentFromS3(filePaths, StorageCategory.profile);
        await this.appMediaContent.destroy({
            where: { id: mediaId },
        });
    }

    async deleteBulkContent(mediaId: number[]) {
        // To be compliant with interface
    }
}
