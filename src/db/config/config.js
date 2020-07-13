module.exports = {
    development: {
        username: 'postgres',
        password: 'mysecretpassword',
        database: 'impactmarket',
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        dialectOptions: {
            bigNumberStrings: true
        }
    },
    staging: {
        dialect: 'postgres',
        dialectOptions: {
            bigNumberStrings: true,
        },
        migrationStorageTableName: 'sequelize_meta_staging',
    },
    production: {
        dialect: 'postgres',
        dialectOptions: {
            bigNumberStrings: true,
        },
        migrationStorageTableName: 'sequelize_meta_production',
    }
};