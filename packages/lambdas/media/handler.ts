import { s3 } from './src/aws';
import { ContentStorage, folderToCategory } from './src/storage';

console.log('Loading function');

const contentStorage = new ContentStorage();

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
        console.log(process.env.E_AWS_REGION)
        console.log(process.env.E_AWS_SECRET_ACCESS_KEY)
        console.log(process.env.E_AWS_SECRET_ACCESS_KEY)

        console.log('ContentType => ', ContentType)
        
        if (Body && ContentType) {
            const keySplit = key.split('/');
            await contentStorage.processAndUpload(
                Body as any,
                ContentType,
                keySplit[keySplit.length - 1],
                folderToCategory(keySplit[0])
            );
            // after successfully uploaded, delete temporary file
            await s3.deleteObject(params).promise();
        }
        return ContentType;
    } catch (err) {
        console.log(err);
        throw new Error(err);
    }
};
