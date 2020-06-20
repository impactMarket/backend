import {
    Router,
} from 'express';
import { upload } from '../storage/s3';

const route = Router();


export default (app: Router) => {
    app.use('/s3', route);

    route.post('/upload', upload.single('photo'), (req, res, next) => {
        res.json(req.file)
    })
};