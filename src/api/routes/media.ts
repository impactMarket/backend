import { MediaController } from '@controllers/media';
import { Router } from 'express';

export default (app: Router): void => {
    const controller = new MediaController();
    const route = Router();

    app.use('/media', route);

    route.post('/thumbnail', controller.postThumbnail);

    route.put('/', controller.updateMedia);
};
