'use strict';

const math = require('mathjs');
module.exports = {
    up: (queryInterface, Sequelize) => {

        const m5 = [87300, 86400, 87600, 86400, 87000, 87000, 87300, 87600, 86700, 86400, 87000, 86400, 86400, 86400, 86400]
        const n5 = [849, 166606, 79969, 26179, 5127, 72251, 7852, 69, 202254, 67904, 1489, 4826, 3278, 316, 1689]

        const calcSSI = (n, m) => parseFloat(((math.median(n) / math.mean(m)) * 100 / 2).toFixed(2))

        return queryInterface.bulkInsert('ssi', [{
            date: new Date(),
            ssi: calcSSI(n5, m5),
            createdAt: new Date(),
            updatedAt: new Date()
        }]);
    },
    down: (queryInterface, Sequelize) => {
    }
};