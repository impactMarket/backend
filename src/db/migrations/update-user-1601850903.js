'use strict';

const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY);
const iv = Buffer.from(process.env.ENCRYPTION_IV);

function encrypt(text) {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}

module.exports = {
    async up(queryInterface, Sequelize) {
        const Users = await queryInterface.sequelize.define('user', {
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
        await Promise.all(users.map(async user => {
            if (user.username !== null) {
                await user.update(
                    { username: encrypt(user.username) },
                    { where: { username: user.username } }
                )
            }
        }))
    },

    down(queryInterface, Sequelize) {
    },
};
