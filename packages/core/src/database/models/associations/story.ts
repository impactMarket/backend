import { DbModels } from '../../../database/db';
import { Sequelize } from 'sequelize';

export function storyAssociation(sequelize: Sequelize) {
    const {
        storyComment,
        storyCommunity,
        storyContent,
        appUser,
        storyEngagement,
        storyUserEngagement,
        storyUserReport,
        community
    } = sequelize.models as DbModels;

    storyCommunity.belongsTo(community, {
        foreignKey: 'communityId',
        as: 'community'
    });

    // used to query from the community with incude
    storyCommunity.belongsTo(storyContent, {
        foreignKey: 'contentId',
        as: 'storyContent'
    });
    // used to post from the content with incude
    storyContent.hasOne(storyCommunity, {
        foreignKey: 'contentId',
        as: 'storyCommunity'
    });
    storyContent.hasMany(storyComment, {
        foreignKey: 'contentId',
        as: 'storyComment'
    });
    storyComment.belongsTo(appUser, {
        foreignKey: 'userId',
        targetKey: 'id',
        as: 'user'
    });

    storyContent.hasOne(appUser, {
        foreignKey: 'address',
        sourceKey: 'byAddress',
        as: 'user'
    });

    // used to post from the content with incude
    storyContent.hasOne(storyEngagement, {
        foreignKey: 'contentId',
        as: 'storyEngagement'
    });

    // used to post from the content with incude
    storyContent.hasMany(storyUserEngagement, {
        foreignKey: 'contentId',
        as: 'storyUserEngagement'
    });

    // used to post from the content with incude
    storyContent.hasMany(storyUserReport, {
        foreignKey: 'contentId',
        as: 'storyUserReport'
    });
}
