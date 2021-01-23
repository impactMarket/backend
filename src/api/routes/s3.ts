import { Router } from 'express';

import { upload } from '../../storage/s3';
import { authenticateToken } from '../middlewares';

const route = Router();

export default (app: Router): void => {
    app.use('/s3', route);

    /**
     * @deprecated Deprecated in mobile-app@0.1.7
     */
    route.post(
        '/upload',
        authenticateToken,
        upload.single('photo'),
        (req, res) => {
            res.json(req.file);
        }
    );
};
