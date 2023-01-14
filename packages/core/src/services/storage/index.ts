import config from '../../config';
import { AWS } from './aws';

enum StorageCategory {
    communityCover,
    promoterLogo,
    story,
    profile,
}
export class ContentStorage {
    protected _generatedStorageFileName(
        category: StorageCategory,
        mimetype: string
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
        const filename = `${now.getTime()}${
            mimetype.length > 0 ? mimetype : '.jpeg'
        }`;
        return [`${filePrefix}$${filename}`, filename];
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
        return {
            uploadURL,
            filename,
            filePath,
        };
    }
}

interface IContentStorage {
    getPresignedUrlPutObject(mime: string): Promise<{
        uploadURL: string;
        filename: string;
    }>;
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
}
