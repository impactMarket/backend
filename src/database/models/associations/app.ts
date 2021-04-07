import { Sequelize } from 'sequelize';

export function appAssociation(sequelize: Sequelize) {
    // used to query from the content model with incude
    sequelize.models.AppMediaContentModel.hasMany(
        sequelize.models.AppMediaThumbnailModel,
        {
            foreignKey: 'mediaContentId',
            as: 'thumbnail',
        }
    );
}
