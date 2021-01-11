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
        database = found[3];
        host = found[4];
    }
    console.log(found);
}

module.exports = {
    development: {
        username: 'postgres',
        password: 'mysecretpassword',
        database: 'impactmarket',
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
    },
    staging: {
        username,
        password,
        database,
        host,
        port: 5432,
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                rejectUnauthorized: false
            }
        }
    },
    production: {
        username,
        password,
        database,
        host,
        port: 5432,
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                rejectUnauthorized: false
            }
        }
    }
};