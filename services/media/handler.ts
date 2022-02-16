import AWS from 'aws-sdk';
import sizeOf from 'image-size';
import sharp from 'sharp';
import path from 'path';
import { services, config } from '@impactmarket/core';

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

enum StorageCategory {
    communityCover,
    promoterLogo,
    story,
    profile,
}

interface IJobThumbnail {
    category: StorageCategory;
    filename: string;
    mediaContentId: number;
    buffer: Buffer;
}

const mediaService = new services.media.MediaService()

export const media = async (event: any, context: any) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(
        event.Records[0].s3.object.key.replace(/\+/g, ' ')
    );
    const params = {
        Bucket: bucket,
        Key: key,
    };

    // assuming "key" follows the principal "topic/imageName.format"
    try {
        const { ContentType, Body } = await s3.getObject(params).promise();
        
        if (Body && ContentType) {
            const keySplit = key.split('/');
            await processAndUpload(
                Body as any,
                ContentType,
                keySplit[keySplit.length - 1],
                folderToCategory(keySplit[0])
            );
            // after successfully uploaded, delete temporary file
            await s3.deleteObject(params).promise();
        }
        return ContentType;
    } catch (err: any) {
        console.log(err);
        throw new Error(err);
    }
};

const updateMedia = async (data: any) => {
    console.log('update media');
    const r = await mediaService.updateMedia(data);
    return r;
}

const postThumbnails = async (data: any[]) => {
    console.log('post thumbnails');
    const r = await mediaService.postThumbnails(data);
    return r;
}

const folderToCategory = (folder: string) => {
    if (folder.indexOf('cover') !== -1) {
        return StorageCategory.communityCover;
    } else if (folder.indexOf('org-logo') !== -1) {
        return StorageCategory.promoterLogo;
    } else if (folder.indexOf('story') !== -1) {
        return StorageCategory.story;
    } else if (folder.indexOf('avatar') !== -1) {
        return StorageCategory.profile;
    }
    throw new Error('invalid folder to category');
}

const processAndUpload = async (
    buffer: Buffer,
    contentType: string,
    filename: string,
    category: StorageCategory
) => {
    // sharp the file
    const dimensions = sizeOf(buffer);
    let { height, width } = dimensions;
    let sharpBuffer: sharp.Sharp | undefined;

    if (
        contentType.toLowerCase().indexOf('jpeg') === -1 ||
        contentType.toLowerCase().indexOf('jpg') === -1
    ) {
        sharpBuffer = sharp(buffer);
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
            sharpBuffer = sharp(buffer);
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
        imgBuffer = buffer;
    }

    if (filename.indexOf('.jpeg') === -1) {
        filename =
            path.basename(filename, path.extname(filename)) + '.jpeg';
    }
    const generated = _generatedStorageFilePath(category, filename);

    const { filePath } = generated;
    filename = generated.filename;
    const uploadResult = await _uploadContentToS3(
        category,
        filePath,
        imgBuffer
    );
    console.log('uploadResult ', uploadResult);

    const mediaContent = await updateMedia({
        url: `${config.cloudfrontUrl}/${uploadResult.Key}`,
        width: width ? width : 0,
        height: height ? height : 0,
    });
    console.log('mediaContent ', mediaContent);

    // add job to queue, return jobId and start async process
    await _createThumbnailFromJob({
        category,
        filename,
        mediaContentId: mediaContent.id,
        buffer: imgBuffer,
    });

    return mediaContent;
}

const _generatedStorageFilePath = (
    category: StorageCategory,
    filename: string,
    thumbnail?: { width: number; height: number },
    pixelRatio?: number
): { filePath: string; filename: string } => {
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
    if (pixelRatio && pixelRatio > 1) {
        const filenameNoExt = filename.split('.jp')[0];
        filename = `${filenameNoExt}${'@' + pixelRatio + 'x'}.jpeg`;
    }
    return {
        filePath: `${filePrefix}${
            thumbnail ? thumbnail.width + 'x' + thumbnail.height + '/' : ''
        }${filename}`,
        filename,
    };
}

const _createThumbnailFromJob = async (jobData: IJobThumbnail) => {
    let thumbnailSizes: { width: number; height: number }[];
    switch (jobData.category) {
        case StorageCategory.story:
            thumbnailSizes = config.thumbnails.story;
            break;
        case StorageCategory.communityCover:
            thumbnailSizes = config.thumbnails.community.cover;
            break;
        case StorageCategory.promoterLogo:
            thumbnailSizes = config.thumbnails.promoter.logo;
            break;
        case StorageCategory.profile:
            thumbnailSizes = config.thumbnails.profile;
            break;
    }

    const thumbnailMedias: any[] = [];
    for (let i = 0; i < config.thumbnails.pixelRatio.length; i++) {
        const pr = config.thumbnails.pixelRatio[i];
        for (let i = 0; i < thumbnailSizes.length; i++) {
            const thumbnailSize = thumbnailSizes[i];
            const thumbnailBuffer = await sharp(jobData.buffer)
                .resize({
                    width: thumbnailSize.width * pr,
                    height: thumbnailSize.height * pr,
                })
                .toBuffer();

            const { filePath } = _generatedStorageFilePath(
                jobData.category,
                jobData.filename,
                thumbnailSize,
                pr
            );
            const thumbnailUploadResult = await _uploadContentToS3(
                jobData.category,
                filePath,
                thumbnailBuffer
            );
            thumbnailMedias.push({
                mediaContentId: jobData.mediaContentId,
                url: `${config.cloudfrontUrl}/${thumbnailUploadResult.Key}`,
                width: thumbnailSize.width,
                height: thumbnailSize.height,
                pixelRatio: pr,
            });
        }
    }
    await postThumbnails(thumbnailMedias);
}

const _uploadContentToS3 = async (
    category: StorageCategory,
    filePath: string,
    fileBuffer: Buffer
): Promise<AWS.S3.ManagedUpload.SendData> => {
    const bucket = _mapCategoryToBucket(category);
    const params: AWS.S3.PutObjectRequest = {
        Bucket: bucket,
        Key: filePath,
        Body: fileBuffer,
        ACL: 'public-read',
    };
    //
    const uploadResult = await s3.upload(params).promise();
    return uploadResult;
};

const _mapCategoryToBucket = (category: StorageCategory) => {
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
