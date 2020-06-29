import {
    Router,
} from 'express';
import { upload } from '../../storage/s3';

const route = Router();


export default (app: Router): void => {
    app.use('/s3', route);

    route.post('/upload', upload.single('photo'), (req, res) => {
        res.json(req.file)
    })
};