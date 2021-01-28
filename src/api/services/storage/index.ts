import config from '../../../config';
import { AWS } from './aws';

const uploadContentToS3 = async (
    filePath: string,
    fileBuffer: Buffer
): Promise<AWS.S3.ManagedUpload.SendData> => {
    const params: AWS.S3.PutObjectRequest = {
        Bucket: config.aws.bucketImagesCommunity,
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
const deleteContentFromS3 = async (filePath: string) => {
    const params: AWS.S3.DeleteObjectRequest = {
        Bucket: config.aws.bucketImagesCommunity,
        Key: filePath.split(`${config.cloudfrontUrl}/`)[1],
    };

    const s3 = new AWS.S3();

    const r = await s3.deleteObject(params).promise();
    console.log(r);
    return true;
};

export { uploadContentToS3, deleteContentFromS3 };
