'use strict';

// eslint-disable-next-line no-undef
module.exports = {
    async up(queryInterface, Sequelize) {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        if (process.env.API_ENVIRONMENT === 'staging') {
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5857, 'BR')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5855, 'BR')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5898, 'BR')`);
    
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5855, 'UG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5801, 'UG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5896, 'UG')`);
    
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5853, 'NG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5700, 'NG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5893, 'NG')`);
            
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5853, 'GH')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5857, 'GH')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5801, 'GH')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5891, 'GH')`);
    
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (5853, 'VE')`);
        } else if (process.env.API_ENVIRONMENT === 'production') {
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (106251, 'BR')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (12928, 'BR')`);
    
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (106251, 'UG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (30880, 'UG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (99878, 'UG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (101542, 'UG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (52493, 'UG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (47511, 'UG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (32522, 'UG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (27371, 'UG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (107433, 'UG')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (56673, 'UG')`);
    
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (106251, 'GH')`);
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (108792, 'GH')`);
    
            await queryInterface.sequelize.query(`insert into microcredit_loan_manager ("userId", country) values (88662, 'VE')`);
        }

    },
    down: queryInterface => {}
};
