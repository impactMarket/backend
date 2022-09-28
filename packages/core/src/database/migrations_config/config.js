let username = '';
let password = '';
let database = '';
let host = '';

if (process.env.API_ENVIRONMENT && process.env.DATABASE_URL) {
    var re = /postgres:\/\/(\w+):(\w+)@([\w-.]+):5432\/(\w+)/i;
    var found = process.env.DATABASE_URL.match(re);
    if (found.length > 3) {
        username = found[1];
        password = found[2];
        host = found[3];
        database = found[4];
    }
    console.log(found);
}

module.exports = {
    ci: {
        username: 'citest',
        password: 'test101',
        database: 'impactmarkettest',
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
    },
    test: {
        username: 'postgres',
        password: 'mysecretpassword',
        database: 'impactmarkettest',
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
    },
    development: {
        username: 'postgres',
        password: 'mysecretpassword',
        database: 'impactmarket',
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        migrationStorageTableName: 'sequelize_meta',
        seederStorage: 'sequelize',
        seederStorageTableName: 'sequelize_data',
    },
    staging: {
        username,
        password,
        database,
        host,
        port: 5432,
        dialect: 'postgres',
        migrationStorageTableName: 'sequelize_meta',
        seederStorage: 'sequelize',
        seederStorageTableName: 'sequelize_data',
        dialectOptions: {
            ssl: {
                rejectUnauthorized: false,
            },
        },
    },
    production: {
        username,
        password,
        database,
        host,
        port: 5432,
        dialect: 'postgres',
        migrationStorageTableName: 'sequelize_meta',
        dialectOptions: {
            ssl: {
                rejectUnauthorized: false,
            },
        },
    },
};
