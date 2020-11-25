'use strict';

const math = require('mathjs');
module.exports = {
    up: async (queryInterface, Sequelize) => {

        const m1 = [86700, 86400, 86400, 86400, 86400]
        const n1 = [31, 26179, 3403, 3767, 1818]

        const m2 = [86400, 87000, 86400, 86400, 86400, 86700, 86700, 86400]
        const n2 = [164215, 3353, 26179, 1663, 3403, 3428, 430, 41293]

        const m3 = [86700, 87000, 86400, 86700, 86700, 86700, 87000, 86400, 86400]
        const n3 = [2841, 3353, 26179, 96, 30885, 3428, 252, 41293, 4518]

        const m4 = [87000, 86400, 87300, 86400, 86700, 86700, 87000, 87300, 86400, 86400, 86700]
        const n4 = [119, 166606, 499, 26179, 96, 30885, 71327, 5271, 41293, 67904, 580]

        const calcSSI = (n, m) => parseFloat(((math.median(n) / math.mean(m)) * 100 / 2).toFixed(2))
        await queryInterface.bulkUpdate('ssi', {
            ssi: calcSSI(n1, m1),
        }, {
            id: 1,
        });
        await queryInterface.bulkUpdate('ssi', {
            ssi: calcSSI(n2, m2),
        }, {
            id: 2,
        });
        await queryInterface.bulkUpdate('ssi', {
            ssi: calcSSI(n3, m3),
        }, {
            id: 3,
        });
        await queryInterface.bulkUpdate('ssi', {
            ssi: calcSSI(n4, m4),
        }, {
            id: 4,
        });
    },
    down: (queryInterface, Sequelize) => {
    }
};