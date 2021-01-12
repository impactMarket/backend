import { Router } from 'express';
// import { authenticateToken } from '../middlewares';
import multer from 'multer';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import path from 'path';
import { Logger } from '@logger/logger';
import config from '../../config';

interface IJobData {
    fileExtension: string;
    pictureContext: string;
    imgBase64: string;
    communityId: string;
}
export default (app: Router): void => {
    const route = Router();
    const uploadImageQueue = new Queue<IJobData>('upload_image_queue', {
        connection: new IORedis(config.redisUrl)
    });
    const storage = multer.memoryStorage()
    const upload = multer({ storage: storage })

    app.use('/storage', route);

    route.post(
        '/upload',
        (req, res) => {
            try {
                upload.single('file')(req, res, (err) => {
                    if (err) {
                        Logger.error('Error during /upload ', err);
                    }
                    const imgBase64 = Buffer.from((req.file as any).buffer).toString('base64');
                    const { pictureContext } = req.body;
                    if (pictureContext === 'community') {
                        const { communityId } = req.body;
                        uploadImageQueue.add(
                            pictureContext + communityId,
                            {
                                fileExtension: path.extname(req.file.originalname),
                                pictureContext,
                                imgBase64,
                                communityId,
                            },
                            { removeOnComplete: true }
                        );
                    }
                });
            } catch (e) {
                Logger.error('Error during /upload ', e);
            }

            // try {
            //     upload.single('file')(req, res, (err) => {
            //         if (err) {
            //             // TODO:
            //             // log error
            //             // send to redis to upload
            //         }


            //         console.log('req.body', (req.file as any).location, req.body.pictureContext);
            //         // TODO: add job to worker to process image
            //     });
            // } catch (e) {
            //     // TODO: do the same as in upload.single error
            // }

            res.sendStatus(200);
        }
    );
};
