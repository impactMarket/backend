import { Router } from 'express';

import { MediaController } from '../../controllers/v1/media';

export default (app: Router): void => {
    const controller = new MediaController();
    const route = Router();

    app.use('/media', route);

    route.post('/thumbnails', controller.postThumbnails);

    route.put('/', controller.updateMedia);
};
