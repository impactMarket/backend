import { Sequelize } from 'sequelize';

export function storyAssociation(sequelize: Sequelize) {
    // used to query from the community with incude
    sequelize.models.Community.hasMany(sequelize.models.StoryCommunityModel, {
        foreignKey: 'communityId',
        as: 'storyCommunity',
    });
    // used to query from the sotry community with incude
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

    // used to query from the community with incude
    sequelize.models.StoryEngagementModel.belongsTo(
        sequelize.models.StoryContentModel,
        {
            foreignKey: 'contentId',
            as: 'storyContent',
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

    // used to query from the community with incude
    sequelize.models.StoryUserEngagementModel.belongsTo(
        sequelize.models.StoryContentModel,
        {
            foreignKey: 'contentId',
            as: 'storyContent',
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

    // used to query from the community with incude
    sequelize.models.StoryUserReportModel.belongsTo(
        sequelize.models.StoryContentModel,
        {
            foreignKey: 'contentId',
            as: 'storyContent',
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
