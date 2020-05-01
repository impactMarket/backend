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
    test: {
    },
    production: {
        username: process.env.PROD_DB_USERNAME,
        password: process.env.PROD_DB_PASSWORD,
        database: process.env.PROD_DB_NAME,
        host: process.env.PROD_DB_HOSTNAME,
        port: process.env.PROD_DB_PORT,
        dialect: 'postgres',
        dialectOptions: {
            bigNumberStrings: true,
        }
    }
};