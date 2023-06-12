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
     * json rpc url fallback
     */
    jsonRpcUrlFallback: validatedEnv.CHAIN_JSON_RPC_URL_FALLBACK,

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
        v2prefix: '/api/v2',
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

    /** contract addresses used to calculate the circulating supply */
    contractAddresses: {
        pact: validatedEnv.PACT_CONTRACT_ADDRESS,
        airgrab: validatedEnv.AIRGRAB_CONTRACT_ADDRESS,
        donationMiner: validatedEnv.DONATION_MINER_CONTRACT_ADDRESS,
        impactLabs: validatedEnv.IMPACTLABS_CONTRACT_ADDRESS,
        dao: validatedEnv.DAO_CONTRACT_ADDRESS,
        ido: validatedEnv.IDO_CONTRACT_ADDRESS,
        treasury: validatedEnv.TREASURY_CONTRACT_ADDRESS,
        learnAndEarn: validatedEnv.LEARN_AND_EARN_CONTRACT_ADDRESS,
        referralLink: validatedEnv.REFERRAL_LINK_CONTRACT_ADDRESS,
    },
    DAOContractAddress: validatedEnv.DAO_CONTRACT_ADDRESS,
    communityAdminAddress: validatedEnv.COMMUNITY_ADMIN_ADDRESS,

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
            microCredit: validatedEnv.AWS_BUCKET_MICROCREDIT,
        },
        lambda: validatedEnv.AWS_LAMBDA,
    },

    /**
     * Cloudfront URL to be useed
     */
    cloudfrontUrl: validatedEnv.CLOUDFRONT_URL,

    /**
     * Thumbnails size for media content
     * 0 (zero) is for auto
     */
    thumbnails: {
        story: [
            {
                width: 94,
                height: 148,
            },
            {
                width: 84,
                height: 140,
            },
        ],
        community: {
            cover: [
                {
                    width: 392,
                    height: 392,
                },
                {
                    width: 293,
                    height: 293,
                },
                {
                    width: 88,
                    height: 88,
                },
                {
                    width: 330,
                    height: 330,
                },
                {
                    width: 42,
                    height: 42,
                },
                {
                    width: 294,
                    height: 294,
                },
            ],
        },
        promoter: {
            logo: [
                {
                    width: 100,
                    height: 100,
                },
            ],
        },
        profile: [
            {
                width: 42,
                height: 42,
            },
            {
                width: 80,
                height: 80,
            },
        ],
        pixelRatio: [1, 2],
    },

    redis: validatedEnv.REDIS_URL,

    positionStackApiBaseUrl: validatedEnv.POSITION_STACK_API_BASE_URL,
    positionStackApiKey: validatedEnv.POSITION_STACK_API_KEY,
    claimVerification: validatedEnv.CLAIM_VERIFICATION,
    storyCronActive: validatedEnv.STORY_CRON_ACTIVE,
    slackApi: validatedEnv.SLACK_API,
    sendgridApi: validatedEnv.SENDGRID_API_KEY,
    internalEmailNotifying: validatedEnv.INTERNAL_EMAIL_NOTIFYING,
    internalEmailToNotify: validatedEnv.INTERNAL_EMAIL_TO_NOTIFY,

    hasRedisTls: validatedEnv.HAS_REDIS_TLS,

    internalNotifications: validatedEnv.INTERNAL_NOTIFICATIONS,

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

    /**
     * Variables for Attestation Service (ASv2) from Celo
     * @see https://github.com/celo-org/identity
     */
    attestations: {
        issuerPrivateKey: validatedEnv.ATTESTATION_ISSUER_PRIVATE_KEY,
        dekPrivateKey: validatedEnv.ATTESTATION_DEK_PRIVATE_KEY,
        odisProxy: validatedEnv.ATTESTATION_ODIS_PROXY,
    },

    /**
     * Variables for Twilio
     * @see https://www.twilio.com/docs/sms/quickstart/node
     */
    twilio: {
        accountSid: validatedEnv.TWILIO_ACCOUNT_SID,
        authToken: validatedEnv.TWILIO_AUTH_TOKEN,
        fromNumber: validatedEnv.TWILIO_FROM_NUMBER,
    },

    /**
     * Variables for chain
     */
    chain: {
        isMainnet: validatedEnv.CHAIN_IS_MAINNET,
        jsonRPCUrlCelo: validatedEnv.CHAIN_JSON_RPC_URL_CELO,
    },

    /**
     * Variables for hot wallets
     * They are used in different sevices and we need to keep track if
     * they have enough balance to perform the operations
     */
    hotWalletsCheckBalance: validatedEnv.HOT_WALLET_CHECK_BALANCE,

    /**
     * Variables for signers
     */
    signers: {
        referralLink: validatedEnv.SIGNERS_REFERRAL_LINK,
    }
};
