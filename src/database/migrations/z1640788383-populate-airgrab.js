'use strict';

const fs = require('fs');
const fetch = require('node-fetch');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV === 'test' || process.env.API_ENVIRONMENT !== 'production') {
        return;
    }
    const url = 'https://storageapi.fleek.co/obernardovieira-26385-team-bucket/merkleTree.json';

    const response = await fetch(url);
    const file = await response.json();

    const claims = file.claims;

    const addresses = Object.keys(claims);

    const users = [];

    for (let i = 0; i < addresses.length; i++) {
      const proof = claims[addresses[i]].proof.map(el => ({
        hashProof: el
      }));
      users.push({
        address: addresses[i],
        index: claims[addresses[i]].index,
        amount: claims[addresses[i]].amount,
        proof,
      });
    }

    const User = await queryInterface.sequelize.define(
      'airgrab_user',
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
        index: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        amount: {
          type: Sequelize.STRING(32),
          allowNull: false,
        }
      },
      {
        tableName: 'airgrab_user',
        sequelize: queryInterface.sequelize,
        timestamps: false,
      }
    );

    const Proof = await queryInterface.sequelize.define(
      'airgrab_proof',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        hashProof: {
          type: Sequelize.STRING(68),
          allowNull: false,
        }
      },
      {
        tableName: 'airgrab_proof',
        sequelize: queryInterface.sequelize,
        timestamps: false,
      }
    );

    User.hasMany(Proof, {
      foreignKey: 'userId',
      sourceKey: 'id',
      as: 'proof',
    });

    const batchSize = 1000;
    for (let i = 0;; i = i+batchSize) {
      await User.bulkCreate(users.slice(i, i + batchSize), {
        include: [
          {
            model: Proof,
            as: 'proof',
          },
        ],
      });
      if (i + batchSize > users.length) {
        break;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
