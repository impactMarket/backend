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
    jwtSecret: process.env.JWT_SECRET!,

    /**
     * Used by winston logger
     */
    logs: {
        level: process.env.LOG_LEVEL || 'verbose',
    },

    /**
     * API configs
     */
    api: {
        prefix: '/api',
    },

    /**
     * Address to the attestation proxy contract
     */
    attestationProxyAddress: process.env.ATTESTATION_PROXY_ADDRESS!,

    /**
     * Contract Address to use in dev
     */
    cUSDContractAddress: process.env.CUSD_CONTRACT_ADDRESS!,

    /**
     * Contract Address to use in dev
     */
    impactMarketContractAddress: process.env.IMPACT_MARKET_CONTRACT_ADDRESS!,

    /**
     * Contract Address to use in dev
     */
    impactMarketContractBlockNumber: parseInt(
        process.env.IMPACT_MARKET_CONTRACT_BLOCK!,
        10
    ),

    /**
     * Used to query
     */
    baseBlockScoutApiUrl: process.env.BLOCKSCOUT_API_URL!,

    /**
     * Decimals in cUSD token
     */
    cUSDDecimal: 18,

    /**
     * Fixer API to get currency rates.
     */
    currenciesApiBaseUrl: process.env.CURRENCIES_API_BASE_URL!,

    /**
     * Fixer API to get currency rates.
     */
    currenciesApiKey: process.env.CURRENCIES_API_KEY!,

    /**
     * Sentry key.
     */
    sentryKey: process.env.SENTRY_KEY!,

    /**
     * Master internal key.
     */
    masterKey: process.env.MASTER_KEY!,

    /**
     * AWS config.
     */
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        region: process.env.AWS_REGION!,
        bucketImagesCommunity: process.env.AWS_BUCKET_IMAGES_COMMUNITY!,
    },

    /**
     * Fleek Storage config.
     */
    fleekStorage: {
        accessKeyId: process.env.FLEEK_STORAGE_KEY_ID!,
        secretAccessKey: process.env.FLEEK_STORAGE_ACCESS_KEY!,
    },

    /**
     * Mobile versions.
     */
    mobileVersion: {
        latest: process.env.LATEST_MOBILE_APP_VERSION!,
        minimal: process.env.MINIMAL_MOBILE_APP_VERSION!,
    },

    /**
     * Placeholder image to use meanwhile community creation.
     */
    communityPlaceholderImageUrl: process.env.COMMUNITY_PLACEHOLDER_IMAGE_URL!,

    /**
     * Cloudfront URL to be useed
     */
    cloudfrontUrl: process.env.CLOUDFRONT_URL!,

    /**
     * tracesSampleRate used in sentry.
     */
    tracesSampleRate: parseInt(process.env.SENTRY_TRACE_SAMPLES_RATE!, 10),

    /**
     *
     */
    adminKey: process.env.ADMIN_KEY!,
};
