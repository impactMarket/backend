import { MediaService } from '@services/media';
import { standardResponse } from '@utils/api';
import { Request, Response } from 'express';

export class MediaController {
    mediaService = new MediaService();

    updateMedia = (req: Request, res: Response) => {
        const { url, width, height } = req.body;
        this.mediaService
            .updateMedia({ url, width, height })
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };

    postThumbnail = (req: Request, res: Response) => {
        const { url, width, height, mediaContentId, pixelRatio } = req.body;
        this.mediaService
            .postThumbnail({ url, width, height, mediaContentId, pixelRatio })
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}
