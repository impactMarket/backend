import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { S3 } from 'aws-sdk';
import fleekStorage from '@fleekhq/fleek-storage-js';
import config from '../../config';
import { Logger } from '@logger/logger';
import CommunityService from '@services/community';

interface IJobData {
    fileExtension: string;
    pictureContext: string;
    imgBase64: string;
    communityId: string;
}
export const startImagesProcess = () => {
    new S3({
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        region: config.aws.region,
        //
        apiVersion: "2006-03-01",
    });

    const worker = new Worker<IJobData>('upload_image_queue', async (job) => {
        const { pictureContext } = job.data;
        if (pictureContext === 'community') {
            const { imgBase64, communityId, fileExtension } = job.data;
            const imgBuffer = Buffer.from(imgBase64, 'base64');
            const today = new Date();
            const s3FilePrefix = `${today.getFullYear()}${(today.getMonth() + 1)}/`;
            const s3Filename = `${Date.now().toString()}${fileExtension}`;
            const s3FilePath = `${s3FilePrefix}${s3Filename}`;
            try {
                const params: S3.PutObjectRequest = {
                    Bucket: config.aws.picturesBucket,
                    Key: s3FilePath,
                    Body: imgBuffer,
                    ACL: 'public-read'
                };
                //
                const upload = new S3.ManagedUpload({ params });
                const uploadResult = await upload.promise();
                // update community picture
                CommunityService.updateCoverImage(communityId, uploadResult.Location);
            } catch (e) {
                Logger.error('Error during worker upload_image_queue(to aws) ' + e);
            }
            try {
                // also upload to fleek storage
                await fleekStorage.upload({
                    apiKey: config.fleekStorage.accessKeyId,
                    apiSecret: config.fleekStorage.secretAccessKey,
                    key: s3FilePath,
                    data: imgBuffer,
                });
            } catch (e) {
                Logger.error('Error during worker upload_image_queue(to fleek) ' + e);
            }
        }
    }, {
        connection: new IORedis(config.redisUrl),
        concurrency: 50
    });

    worker.on('completed', (job) => {
        console.log(`${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
        console.log(`${job.id} has failed with ${err.message}`);
    });
}