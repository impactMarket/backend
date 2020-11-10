'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const Users = await queryInterface.sequelize.define('user', {
            address: {
                type: Sequelize.STRING(44),
                allowNull: false,
                unique: true,
                primaryKey: true,
            },
            username: {
                type: Sequelize.STRING(64),
            },
            avatar: {
                type: Sequelize.STRING(128),
            },
            language: {
                type: Sequelize.STRING(8),
                allowNull: false,
            },
            currency: {
                type: Sequelize.STRING(4),
            },
            pushNotificationToken: {
                type: Sequelize.STRING(64),
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            }
        }, {
            tableName: 'user',
            sequelize: queryInterface.sequelize, // this bit is important
        });
        const users = await Users.findAll({});
        const Transactions = await queryInterface.sequelize.define('transactions', {
            uid: {
                type: Sequelize.STRING(64),
                primaryKey: true,
                unique: true,
            },
            tx: {
                type: Sequelize.STRING(68),
                allowNull: false,
            },
            txAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            from: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
            contractAddress: {
                type: Sequelize.STRING(44),
                allowNull: false,
            },
            event: {
                type: Sequelize.STRING(64),
                allowNull: false,
            },
            values: {
                type: Sequelize.JSONB,
                allowNull: false,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            }
        }, {
            tableName: 'transactions',
            sequelize: queryInterface.sequelize, // this bit is important
        });
        const Community = await queryInterface.sequelize.define('community', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            publicId: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                unique: true,
                allowNull: false,
            },
            requestByAddress: {
                type: Sequelize.STRING(44),
                unique: true,
                allowNull: false,
            },
            contractAddress: {
                type: Sequelize.STRING(44),
            },
            name: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            description: {
                type: Sequelize.STRING(1024),
                allowNull: false
            },
            descriptionEn: {
                type: Sequelize.STRING(1024),
                allowNull: true
            },
            language: {
                type: Sequelize.STRING(8),
                defaultValue: 'en',
                allowNull: false
            },
            currency: {
                type: Sequelize.STRING(4),
                defaultValue: 'USD',
                allowNull: false
            },
            city: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            country: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            gps: {
                type: Sequelize.JSON,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(64),
                allowNull: false
            },
            visibility: {
                type: Sequelize.ENUM('public', 'private'),
                allowNull: false
            },
            coverImage: {
                type: Sequelize.STRING(128),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('pending', 'valid', 'removed'),
                allowNull: false
            },
            txCreationObj: {
                type: Sequelize.JSON
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            }
        }, {
            tableName: 'community',
            sequelize: queryInterface.sequelize, // this bit is important
        });
        const beneficiariesToInsert = [];
        for (let index = 0; index < users.length; index++) {
            const user = users[index];
            const reqResult = await Transactions.findAll({
                limit: 1,
                where: {
                    event: {
                        [Sequelize.Op.or]: [
                            'BeneficiaryAdded',
                            'BeneficiaryRemoved'
                        ],
                    },
                    values: { _account: user.address },
                },
                order: [['createdAt', 'DESC']]
            });
            if (reqResult.length !== 0 && reqResult[0].event !== 'BeneficiaryRemoved') {
                const community = await Community.findOne({ where: { contractAddress: reqResult[0].contractAddress } });
                if (community !== null) {
                    beneficiariesToInsert.push({
                        address: user.address,
                        communityId: community.publicId,
                        txAt: reqResult[0].txAt,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }
        }
        return queryInterface.bulkInsert('beneficiary', beneficiariesToInsert);
    },

    down(queryInterface, Sequelize) {
    },
};
