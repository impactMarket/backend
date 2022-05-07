import { Sequelize } from 'sequelize';

export function storyAssociation(sequelize: Sequelize) {
    // used to query from the sotry community with incude
    // TODO: maybe remove
    sequelize.models.StoryCommunityModel.belongsTo(sequelize.models.Community, {
        foreignKey: 'communityId',
        as: 'community',
    });

    // used to query from the community with incude
    sequelize.models.StoryCommunityModel.belongsTo(
        sequelize.models.StoryContentModel,
        {
            foreignKey: 'contentId',
            as: 'storyContent',
        }
    );
    // used to post from the content with incude
    sequelize.models.StoryContentModel.hasOne(
        sequelize.models.StoryCommunityModel,
        {
            foreignKey: 'contentId',
            as: 'storyCommunity',
        }
    );
    // used to post from the content with incude
    sequelize.models.StoryContentModel.hasOne(
        sequelize.models.AppMediaContentModel,
        {
            foreignKey: 'id',
            sourceKey: 'mediaMediaId',
            as: 'media',
            constraints: false,
        }
    );

    sequelize.models.StoryContentModel.hasOne(
        sequelize.models.AppUserModel,
        {
            foreignKey: 'address',
            sourceKey: 'byAddress',
            as: 'user',
        }
    );

    // used to post from the content with incude
    sequelize.models.StoryContentModel.hasOne(
        sequelize.models.StoryEngagementModel,
        {
            foreignKey: 'contentId',
            as: 'storyEngagement',
        }
    );

    // used to post from the content with incude
    sequelize.models.StoryContentModel.hasMany(
        sequelize.models.StoryUserEngagementModel,
        {
            foreignKey: 'contentId',
            as: 'storyUserEngagement',
        }
    );

    // used to post from the content with incude
    sequelize.models.StoryContentModel.hasMany(
        sequelize.models.StoryUserReportModel,
        {
            foreignKey: 'contentId',
            as: 'storyUserReport',
        }
    );
}
