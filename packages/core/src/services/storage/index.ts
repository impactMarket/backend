import config from '../../config';
import { AWS } from './aws';

type PreSignedUrlResponse = {
    uploadURL: string;
    filename: string;
    filePath: string;
};
enum StorageCategory {
    communityCover,
    promoterLogo,
    story,
    profile,
    microCredit
}
export class ContentStorage {
    protected _getContentTypesFromMime(mime: string): string {
        switch (mime) {
            // images
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'avif':
                return 'image/avif';
            case 'bmp':
                return 'image/bmp';
            case 'svg':
                return 'image/svg+xml';
            case 'gif':
                return 'image/gif';
            case 'webp':
                return 'image/webp';
            case 'tiff':
                return 'image/tiff';
            // videos
            case 'mp4':
                return 'video/mp4';
            case 'mpeg':
                return 'video/mpeg';
            case 'webm':
                return 'video/webm';
            case 'ogv':
                return 'video/ogg';
            case '3gp':
                return 'video/3gpp';
            case '3g2':
                return 'video/3gpp2';
            case 'mov':
                return 'video/quicktime';
            case 'avi':
                return 'video/x-msvideo';
            // files
            case 'pdf':
                return 'application/pdf';
            default:
                throw new Error(`Mime type ${mime} not supported`);
        }
    }

    protected _getBucketConfig(category: StorageCategory) {
        switch (category) {
            case StorageCategory.microCredit:
                return {
                    Bucket: config.aws.bucket.microCredit,
                    ACL: 'private'
                };
            default:
                return {
                    Bucket: config.aws.bucket.app,
                    ACL: 'public-read'
                };
        }
    }

    protected _generatedStorageFileName(category: StorageCategory, mimetype: string): string[] {
        // s3 recommends to use file prefix. Works like folders
        // some buckets do not have folders
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
        const filename = `${now.getTime()}${Math.ceil(Math.random() * (999 - 100) + 100)}${mimetype}`;
        return [`${filePrefix}${filename}`, filename];
    }

    protected async _getPresignedUrlPutObject(mime: string, category: StorageCategory): Promise<PreSignedUrlResponse> {
        // jpg or jpe are not a mimetype
        if (mime === 'jpg' || mime === 'jpe') {
            mime = 'jpeg';
        }
        const [filePath, filename] = this._generatedStorageFileName(category, `.${mime}`);
        const params: AWS.S3.PutObjectRequest = {
            Key: filePath,
            ContentType: this._getContentTypesFromMime(mime),
            ...this._getBucketConfig(category)
        };
        const s3 = new AWS.S3();
        const uploadURL = await s3.getSignedUrlPromise('putObject', params);
        return {
            uploadURL,
            filename,
            filePath
        };
    }
}

interface IContentStorage {
    getPresignedUrlPutObject(mime: string): Promise<PreSignedUrlResponse>;
}

export class StoryContentStorage extends ContentStorage implements IContentStorage {
    getPresignedUrlPutObject(mime: string) {
        return this._getPresignedUrlPutObject(mime, StorageCategory.story);
    }
}

export class CommunityContentStorage extends ContentStorage implements IContentStorage {
    getPresignedUrlPutObject(mime: string) {
        return this._getPresignedUrlPutObject(mime, StorageCategory.communityCover);
    }
}

export class PromoterContentStorage extends ContentStorage implements IContentStorage {
    getPresignedUrlPutObject(mime: string) {
        return this._getPresignedUrlPutObject(mime, StorageCategory.promoterLogo);
    }
}

export class ProfileContentStorage extends ContentStorage implements IContentStorage {
    getPresignedUrlPutObject(mime: string) {
        return this._getPresignedUrlPutObject(mime, StorageCategory.profile);
    }
}

export class MicroCreditContentStorage extends ContentStorage implements IContentStorage {
    getPresignedUrlPutObject(mime: string) {
        return this._getPresignedUrlPutObject(mime, StorageCategory.microCredit);
    }
}
