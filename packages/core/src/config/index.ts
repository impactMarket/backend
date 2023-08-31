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
     * json rpc url
     */
    webSocketUrl: validatedEnv.CHAIN_WEB_SOCKET_URL,

    /**
     * json rpc url fallback
     */
    jsonRpcUrlFallback: validatedEnv.CHAIN_JSON_RPC_URL_FALLBACK,

    /**
     * json rpc url fallback
     */
    webSocketUrlFallback: validatedEnv.CHAIN_WEB_SOCKET_URL_FALLBACK,

    /**
     * Your secret sauce
     */
    jwtSecret: validatedEnv.JWT_SECRET,

    /**
     * Used by winston logger
     */
    logs: {
        level: validatedEnv.LOG_LEVEL
    },

    /**
     * API configs
     */
    api: {
        prefix: '/api'
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
     * Assets address separated by colon
     */
    assetsAddress: validatedEnv.ASSETS_ADDRESS,

    /**
     * Contract Address to use in dev
     */
    impactMarketContractBlockNumber: validatedEnv.IMPACT_MARKET_CONTRACT_BLOCK,

    /** contract addresses */
    contractAddresses: {
        pact: validatedEnv.PACT_CONTRACT_ADDRESS,
        airgrab: validatedEnv.AIRGRAB_CONTRACT_ADDRESS,
        donationMiner: validatedEnv.DONATION_MINER_CONTRACT_ADDRESS,
        impactLabs: validatedEnv.IMPACTLABS_CONTRACT_ADDRESS,
        dao: validatedEnv.DAO_CONTRACT_ADDRESS,
        ido: validatedEnv.IDO_CONTRACT_ADDRESS,
        treasury: validatedEnv.TREASURY_CONTRACT_ADDRESS
    },
    DAOContractAddress: validatedEnv.DAO_CONTRACT_ADDRESS,
    communityAdminAddress: validatedEnv.COMMUNITY_ADMIN_ADDRESS,
    microcreditContractAddress: validatedEnv.MICROCREDIT_CONTRACT_ADDRESS,

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
     * AWS config.
     */
    aws: {
        accessKeyId: validatedEnv.AWS_ACCESS_KEY_ID,
        secretAccessKey: validatedEnv.AWS_SECRET_ACCESS_KEY,
        region: validatedEnv.AWS_REGION,
        bucket: {
            app: validatedEnv.AWS_BUCKET_APP,
            microCredit: validatedEnv.AWS_BUCKET_MICROCREDIT
        },
        lambda: validatedEnv.AWS_LAMBDA
    },

    /**
     * Cloudfront URL to be useed
     */
    cloudfrontUrl: validatedEnv.CLOUDFRONT_URL,

    redis: validatedEnv.REDIS_URL,

    claimVerification: validatedEnv.CLAIM_VERIFICATION,
    storyCronActive: validatedEnv.STORY_CRON_ACTIVE,
    slack: {
        token: validatedEnv.SLACK_TOKEN,
        lambdaChannel: validatedEnv.SLACK_LAMBDA_CHANNEL
    },
    sendgridApi: validatedEnv.SENDGRID_API_KEY,
    firebaseFileBase64: validatedEnv.FIREBASE_FILE_BASE64,

    hasRedisTls: validatedEnv.HAS_REDIS_TLS,

    maxRequestPerUser: validatedEnv.MAX_REQUEST_PER_USER,
    hubspotKey: validatedEnv.HUBSPOT_KEY,

    claimLocationTimeframe: validatedEnv.CLAIM_LOCATION_TIMEFRAME,
    claimInactivityThreshold: validatedEnv.CLAIM_INACTIVITY_THRESHOLD,

    /**
     * Days without login to consider a user inactive
     */
    loginInactivityThreshold: validatedEnv.LOGIN_INACTIVITY_THRESHOLD,

    defaultLimit: validatedEnv.DEFAULT_LIMIT,
    defaultOffset: validatedEnv.DEFAULT_OFFSET,

    subgraphUrl: validatedEnv.SUBGRAPH_URL,
    councilSubgraphUrl: validatedEnv.COUNCIL_SUBGRAPH_URL,
    microcreditSubgraphUrl: validatedEnv.MICROCREDIT_SUBGRAPH_URL,
    imageHandlerUrl: validatedEnv.IMAGE_HANDLER_URL,
    learnAndEarnPrivateKey: validatedEnv.LEARN_AND_EARN_PRIVATE_KEY,
    intervalBetweenLessons: validatedEnv.INTERVAL_BETWEEN_LESSONS,
    daysToLimitUsers: validatedEnv.DAYS_TO_LIMIT_USERS,
    cronJobBatchSize: validatedEnv.CRON_JOB_BATCH_SIZE,

    maxDatabasePoolConnections: validatedEnv.MAX_DATABASE_POOL_CONNECTIONS,

    communityResponseTimeout: validatedEnv.COMMUNITY_RESPONSE_TIMEOUT
};
