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
    dbUrl: process.env.DATABASE_URL!,

    /**
     * json rpc url
     */
    jsonRpcUrl: process.env.CHAIN_JSON_RPC_URL!,

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
    },

    /**
     * Contract Address to use in dev
     */
    impactMarketContractAddress: process.env.IMPACT_MARKET_CONTRACT_ADDRESS!,

    /**
     * Contract Address to use in dev
     */
    impactMarketContractBlockNumber: parseInt(process.env.IMPACT_MARKET_CONTRACT_BLOCK!, 10),
};