import { AppMediaThumbnailCreation } from '@interfaces/app/appMediaThumbnail';
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

    postThumbnails = (req: Request, res: Response) => {
        const thumbnailMedias: AppMediaThumbnailCreation[] = [];
        const { body } = req;
        for (let i = 0; i < body; i++) {
            const { url, width, height, mediaContentId, pixelRatio } = body[i];
            thumbnailMedias.push({
                url,
                width,
                height,
                mediaContentId,
                pixelRatio,
            });
        }
        this.mediaService
            .postThumbnails(thumbnailMedias)
            .then((r) => standardResponse(res, 200, true, r))
            .catch((e) => standardResponse(res, 400, false, '', { error: e }));
    };
}
