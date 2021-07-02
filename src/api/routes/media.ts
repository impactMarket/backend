import { MediaController } from '@controllers/media';
import { Router } from 'express';

export default (app: Router): void => {
    const controller = new MediaController();

    app.post('/thumbnail', controller.postThumbnail);

    app.put('/', controller.updateMedia);
};
