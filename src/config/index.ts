import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (!envFound) {
    // This error should crash whole process

    throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
    /**
     * Your favorite port
     */
    port: parseInt(process.env.PORT!, 10),

    /**
     * Database access config
     */
    db: {
        user: process.env.POSTGRES_USER!,
        pass: process.env.POSTGRES_PASS!,
        host: process.env.POSTGRES_HOST!,
        dbName: process.env.POSTGRES_DBNAME!,
    },

    /**
     * json rpc url
     */
    jsonRpcUrl: process.env.CHAIN_JSON_RPC_URL,

    /**
     * Your secret sauce
     */
    jwtSecret: process.env.JWT_SECRET,

    /**
     * Used by winston logger
     */
    logs: {
        level: process.env.LOG_LEVEL || 'silly',
    },

    /**
     * API configs
     */
    api: {
        prefix: '/api',
    }
};