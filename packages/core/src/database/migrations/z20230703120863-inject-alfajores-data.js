'use strict';

const ethers = require('ethers');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.API_ENVIRONMENT === 'production') {
            return;
        }

        const borrowers = [
            {
                id: '0x07a3f76f2b92af8d8f79a41b45739c7718ffc3c7'
            },
            {
                id: '0x1732aead09143608dc56ae9173bdbdb7468cff6e'
            },
            {
                id: '0x185f2b301231fab7c83893e449a56f79905d39ff'
            },
            {
                id: '0x19fa2976a8d55a8d733da471d6dcc1a308572b72'
            },
            {
                id: '0x1cee59c0e744478817959d9d0c6801ca86b664f0'
            },
            {
                id: '0x21ed3f458bfa78c7dde91dc76c916dbc61cfd735'
            },
            {
                id: '0x266490c833928159f3803e7e4f17dec3585e570f'
            },
            {
                id: '0x2745b7fda1dd04a0f05b42b1e85ec3ad04d607f3'
            },
            {
                id: '0x286cd9f6e8ef062a29b71ded2e7b086c27de9618'
            },
            {
                id: '0x2abae50300759c283af0ae0322891e18ab688dec'
            },
            {
                id: '0x33b650c44f6af08adbfd0405383e87977112d71a'
            },
            {
                id: '0x409e34321f4770621f4dee1d9f17a775c5a318c0'
            },
            {
                id: '0x43d22ea4623b97c41372b29345024bd9c535f7ee'
            },
            {
                id: '0x5bde6f9a08a0a929fcb043341b1d8b7da2ac692e'
            },
            {
                id: '0x5c7f26811aab19c668621b1239bb92c6480d8c37'
            },
            {
                id: '0x707c4bf95e0abf1061874ae3a83cff8fc7b796d9'
            },
            {
                id: '0x7867b012c2afa1ac075252a85b42e2345ae109db'
            },
            {
                id: '0x7d46650fc90daf690d92d9fe89cdd918bfe99e72'
            },
            {
                id: '0x7da11ef9a7d4900704682bea196cac1a9e49e4d6'
            },
            {
                id: '0x829be7dfa214ca19dd8a135ce9a161e4d52120d4'
            },
            {
                id: '0x8fbe40e856aa31e14840a2eb8d6ee9d0ea6d8f6e'
            },
            {
                id: '0x90b14926d88ad51c871f6b08d98e7157e40233be'
            },
            {
                id: '0x9c2f3d36e15e5b40f08640a782435f15266aeb96'
            },
            {
                id: '0xaad66c1ec0d0b6e603a675da2a4166f5e211c299'
            },
            {
                id: '0xad0541f0889736b2840fc0b3301bb68d043f1505'
            },
            {
                id: '0xb5acfeab8560c3851946b8e6923f241f9517bb78'
            },
            {
                id: '0xbcbeb4e2aa1b13b1de5054ee38e502432c22baca'
            },
            {
                id: '0xbfa720bda56a52832247896812b40d6b92633cac'
            },
            {
                id: '0xcae94bc39045f9fa3bb7ffab28299ab9502fcd4e'
            },
            {
                id: '0xcbcbf1084a8c43e23a7e9f57327a97c77343ebb1'
            }
        ];

        const User = await queryInterface.sequelize.define(
            'app_user',
            {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                address: {
                    type: Sequelize.STRING(44),
                    allowNull: false,
                    unique: true,
                },
                avatarMediaPath: {
                    type: Sequelize.STRING(44),
                    allowNull: true,
                },
                firstName: {
                    type: Sequelize.STRING(128),
                },
                lastName: {
                    type: Sequelize.STRING(128),
                },
                language: {
                    type: Sequelize.STRING(8),
                    defaultValue: 'en',
                    allowNull: false,
                },
                currency: {
                    type: Sequelize.STRING(4),
                    defaultValue: 'USD',
                },
                walletPNT: {
                    type: Sequelize.STRING(256),
                },
                appPNT: {
                    type: Sequelize.STRING(256),
                },
                gender: {
                    type: Sequelize.STRING(2),
                },
                year: {
                    type: Sequelize.INTEGER,
                },
                children: {
                    type: Sequelize.INTEGER,
                },
                lastLogin: {
                    type: Sequelize.DATE,
                    defaultValue: Sequelize.fn('now'),
                    allowNull: false,
                },
                active: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true,
                    allowNull: false,
                },
                email: {
                    type: Sequelize.STRING(64),
                    allowNull: true,
                },
                emailValidated: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                },
                bio: {
                    type: Sequelize.STRING(512),
                    allowNull: true,
                },
                country: {
                    type: Sequelize.STRING(64),
                    allowNull: true,
                },
                phone: {
                    type: Sequelize.STRING(64),
                    allowNull: true,
                },
                phoneValidated: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                },
                readBeneficiaryRules: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                readManagerRules: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                createdAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
                updatedAt: {
                    allowNull: false,
                    type: Sequelize.DATE,
                },
                deletedAt: {
                    allowNull: true,
                    type: Sequelize.DATE,
                },
            },
            {
                tableName: 'app_user',
                sequelize: queryInterface.sequelize, // this bit is important
            }
        );

        const MicroCreditBorrowers = await queryInterface.sequelize.define(
            'microcredit_borrowers',
            {
                id: {
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                    type: Sequelize.INTEGER
                },
                userId: {
                    allowNull: false,
                    type: Sequelize.INTEGER
                },
                performance: {
                    allowNull: false,
                    type: Sequelize.INTEGER
                },
                lastNotificationRepayment: {
                    allowNull: true,
                    type: Sequelize.DATE
                }
            },
            {
                tableName: 'microcredit_borrowers',
                sequelize: queryInterface.sequelize, // this bit is important
                timestamps: false
            }
        );

        const users = await User.findAll({
            attributes: ['id'],
            where: {
                address: {
                    [Sequelize.Op.in]: borrowers.map(borrower => ethers.utils.getAddress(borrower.id))
                }
            }
        });

        await MicroCreditBorrowers.bulkCreate(users.map(user => ({ userId: user.id, performance: 100 })));
    },
    async down(queryInterface, Sequelize) { }
};
