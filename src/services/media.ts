import { AppMediaContentCreation } from '@interfaces/app/appMediaContent';
import { AppMediaThumbnailCreation } from '@interfaces/app/appMediaThumbnail';

import { models } from '../database';

export class MediaService {
    async updateMedia(content: AppMediaContentCreation) {
        console.log(content);
        const r = await models.appMediaContent.update(
            {
                height: content.height,
                width: content.width,
            },
            { where: { url: content.url }, returning: true }
        );
        if (r[0] > 0) {
            return r[1][0];
        }
        throw new Error('not updated!');
    }

    postThumbnail(content: AppMediaThumbnailCreation) {
        return models.appMediaThumbnail.create(content);
    }
}
