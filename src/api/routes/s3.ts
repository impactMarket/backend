import { Router } from 'express';

import { authenticateToken } from '../middlewares';
import { upload } from '../../storage/s3';

const route = Router();

export default (app: Router): void => {
    app.use('/s3', route);

    // TODO: include this under the /community/request request
    route.post(
        '/upload',
        authenticateToken,
        upload.single('photo'),
        (req, res) => {
            res.json(req.file);
        }
    );
};
