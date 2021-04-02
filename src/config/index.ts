import validateEnv from './validatenv';

const validatedEnv = validateEnv();

export default {
    /**
     * Your favorite port
     */
    port: validatedEnv.PORT,

    /**
     * Database access config
     */
    dbUrl: validatedEnv.DATABASE_URL,

    /**
     * json rpc url
     */
    jsonRpcUrl: validatedEnv.CHAIN_JSON_RPC_URL,

    /**
     * Your secret sauce
     */
    jwtSecret: validatedEnv.JWT_SECRET,

    /**
     * Used by winston logger
     */
    logs: {
        level: validatedEnv.LOG_LEVEL,
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
    attestationProxyAddress: validatedEnv.ATTESTATION_PROXY_ADDRESS,

    /**
     * Contract Address to use in dev
     */
    cUSDContractAddress: validatedEnv.CUSD_CONTRACT_ADDRESS,

    /**
     * Contract Address to use in dev
     */
    impactMarketContractAddress: validatedEnv.IMPACT_MARKET_CONTRACT_ADDRESS,

    /**
     * Contract Address to use in dev
     */
    impactMarketContractBlockNumber: validatedEnv.IMPACT_MARKET_CONTRACT_BLOCK,

    /**
     * Decimals in cUSD token
     */
    cUSDDecimal: 18,

    /**
     * Fixer API to get currency rates.
     */
    currenciesApiBaseUrl: validatedEnv.CURRENCIES_API_BASE_URL,

    /**
     * Fixer API to get currency rates.
     */
    currenciesApiKey: validatedEnv.CURRENCIES_API_KEY,

    /**
     * Sentry key.
     */
    sentryKey: validatedEnv.SENTRY_KEY,

    /**
     * Master internal key.
     */
    masterKey: validatedEnv.MASTER_KEY,

    /**
     * AWS config.
     */
    aws: {
        accessKeyId: validatedEnv.AWS_ACCESS_KEY_ID,
        secretAccessKey: validatedEnv.AWS_SECRET_ACCESS_KEY,
        region: validatedEnv.AWS_REGION,
        bucketCommunityCover: validatedEnv.AWS_BUCKET_COMMUNITY_COVER,
        bucketCommunityLogo: validatedEnv.AWS_BUCKET_COMMUNITY_LOGO,
        bucketImagesStory: validatedEnv.AWS_BUCKET_IMAGES_STORY,
    },

    /**
     * Fleek Storage config.
     */
    fleekStorage: {
        accessKeyId: validatedEnv.FLEEK_STORAGE_KEY_ID,
        secretAccessKey: validatedEnv.FLEEK_STORAGE_ACCESS_KEY,
    },

    /**
     * Mobile versions.
     */
    mobileVersion: {
        latest: validatedEnv.LATEST_MOBILE_APP_VERSION,
        minimal: validatedEnv.MINIMAL_MOBILE_APP_VERSION,
    },

    /**
     * Placeholder image to use meanwhile community creation.
     */
    communityPlaceholderImageUrl: validatedEnv.COMMUNITY_PLACEHOLDER_IMAGE_URL,

    /**
     * Cloudfront URL to be useed
     */
    cloudfrontUrl: validatedEnv.CLOUDFRONT_URL,

    /**
     * tracesSampleRate used in sentry.
     */
    tracesSampleRate: validatedEnv.SENTRY_TRACE_SAMPLES_RATE,

    /**
     * Key used to hash
     */
    hashKey: validatedEnv.HASH_KEY,

    /**
     *
     */
    adminKey: validatedEnv.ADMIN_KEY,
};
