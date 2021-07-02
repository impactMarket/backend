import { AppMediaContentCreation } from '@interfaces/app/appMediaContent';
import { AppMediaThumbnailCreation } from '@interfaces/app/appMediaThumbnail';

import { models } from '../database';

export class MediaService {
    updateMedia(content: AppMediaContentCreation) {
        return models.appMediaContent.update(
            {
                height: content.height,
                width: content.width,
            },
            { where: { url: content.url } }
        );
    }

    postThumbnail(content: AppMediaThumbnailCreation) {
        return models.appMediaThumbnail.create(content);
    }
}
