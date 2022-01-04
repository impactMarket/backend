import { MediaController } from '@controllers/media';
import { Router } from 'express';

export default (app: Router): void => {
    const controller = new MediaController();
    const route = Router();

    app.use('/media', route);

    route.post('/thumbnails', controller.postThumbnails);

    route.put('/', controller.updateMedia);
};
