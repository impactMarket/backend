import { bool, cleanEnv, num, port, str } from 'envalid';
import dotenv from 'dotenv';

// TODO: api uses instead of the package validation.
// This need to be refactoed
if (process.env.NODE_ENV === 'development') {
    const envFound = dotenv.config();
    if (!envFound) {
        // This error should crash whole process

        throw new Error("⚠️  Couldn't find .env file  ⚠️");
    }
} else if (process.env.NODE_ENV === 'test') {
    const envFound = dotenv.config({ path: '.env.test' });
    if (!envFound) {
        // This error should crash whole process

        throw new Error("⚠️  Couldn't find .env file  ⚠️");
    }
} else if (process.env.RUN_LOCAL_BUILD === 'true') {
    // to run local build
    const envFound = dotenv.config();
    if (!envFound) {
        // This error should crash whole process

        throw new Error("⚠️  Couldn't find .env file  ⚠️");
    }
}

function onlyOnTestEnv(testDefault: any) {
    return process.env.NODE_ENV === 'test' ? testDefault : undefined;
}

function validateEnv() {
    return cleanEnv(process.env, {
        NODE_ENV: str(),
        PORT: port({ devDefault: onlyOnTestEnv(5000) }),
        DATABASE_URL: str(),
        DATABASE_NUMBER_OF_REPLICAS: num({ default: 0 }),
        CHAIN_JSON_RPC_URL: str({
            devDefault: onlyOnTestEnv('http://localhost:8545')
        }),
        CHAIN_WEB_SOCKET_URL: str({
            devDefault: onlyOnTestEnv('ws://localhost:8545')
        }),
        CHAIN_JSON_RPC_URL_FALLBACK: str({
            devDefault: onlyOnTestEnv('http://localhost:8545')
        }),
        CHAIN_WEB_SOCKET_URL_FALLBACK: str({
            devDefault: onlyOnTestEnv('ws://localhost:8545')
        }),
        JWT_SECRET: str({ devDefault: onlyOnTestEnv('xyz') }),
        CUSD_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        IMPACT_MARKET_CONTRACT_ADDRESS: str({
            devDefault: onlyOnTestEnv('xyz')
        }),
        IMPACT_MARKET_CONTRACT_BLOCK: num({ devDefault: 0 }),
        ATTESTATION_PROXY_ADDRESS: str({ default: '0x0000000000000000000000000000000000000000' }),
        // aws config
        AWS_ACCESS_KEY_ID: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_SECRET_ACCESS_KEY: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_REGION: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_BUCKET_APP: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_BUCKET_MICROCREDIT: str({ devDefault: onlyOnTestEnv('xyz') }),
        //
        CURRENCIES_API_BASE_URL: str({ devDefault: onlyOnTestEnv('xyz') }),
        CURRENCIES_API_KEY: str({ devDefault: onlyOnTestEnv('xyz') }),
        CLAIM_VERIFICATION: bool({ default: false }),
        LOG_LEVEL: str({ default: 'warn' }),
        API_ENVIRONMENT: str({
            choices: ['development', 'test', 'production', 'staging'],
            devDefault: 'test'
        }),
        CLOUDFRONT_URL: str({ devDefault: onlyOnTestEnv('xyz') }),
        REDIS_URL: str({ devDefault: 'redis://localhost:6379' }),
        STORY_CRON_ACTIVE: bool({ default: false }),
        SLACK_TOKEN: str({ default: 'xyz' }),
        SLACK_LAMBDA_CHANNEL: str({ default: 'xyz' }),
        SENDGRID_API_KEY: str({ default: 'xyz' }),
        FIREBASE_FILE_BASE64: str({ default: 'a0' }),
        HAS_REDIS_TLS: bool({ default: true }),
        MAX_REQUEST_PER_USER: num({ default: 900 }),
        HUBSPOT_KEY: str({ devDefault: 'xyz' }),
        DAO_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        COMMUNITY_ADMIN_ADDRESS: str({ default: '0x0000000000000000000000000000000000000000' }),
        MICROCREDIT_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        CLAIM_LOCATION_TIMEFRAME: num({ default: 150 }),
        CLAIM_INACTIVITY_THRESHOLD: num({ default: 4 }),
        LOGIN_INACTIVITY_THRESHOLD: num({ default: 10 }),
        DEFAULT_LIMIT: num({ default: 10 }),
        DEFAULT_OFFSET: num({ default: 0 }),
        PACT_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        AIRGRAB_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        DONATION_MINER_CONTRACT_ADDRESS: str({
            devDefault: onlyOnTestEnv('xyz')
        }),
        IMPACTLABS_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        IDO_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        TREASURY_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_LAMBDA: bool({ default: false }),
        SUBGRAPH_URL: str({ devDefault: onlyOnTestEnv('xyz') }),
        COUNCIL_SUBGRAPH_URL: str({ devDefault: onlyOnTestEnv('xyz') }),
        MICROCREDIT_SUBGRAPH_URL: str({ devDefault: onlyOnTestEnv('xyz') }),
        IMAGE_HANDLER_URL: str({ devDefault: onlyOnTestEnv('xyz') }),
        INTERVAL_BETWEEN_LESSONS: num({ default: 7 }),
        DAYS_TO_LIMIT_USERS: num({ default: 30 }),
        CRON_JOB_BATCH_SIZE: num({ default: 20 }),
        // database pool config
        DATABASE_POOL_MAX_CONNECTIONS: num({ default: 5 }),
        DATABASE_POOL_ACQUIRE: num({ default: 60000 }),
        DATABASE_POOL_IDLE: num({ default: 10000 }),
        DATABASE_POOL_EVICT: num({ default: 1000 }),
        //
        ASSETS_ADDRESS: str({ default: '[{ "address": "xyz", "asset": "xyz" }]' }),
        MAX_DATABASE_POOL_CONNECTIONS: num({ default: 20 }),
        COMMUNITY_RESPONSE_TIMEOUT: num({ default: 50000 }),
        // chain variables
        CHAIN_IS_MAINNET: bool({ default: false }),
        CHAIN_JSON_RPC_URL_CELO: str({ default: 'https://alfajores-forno.celo-testnet.org' }),
        CHAIN_JSON_RPC_URL_POLYGON: str({ default: 'https://rpc-mumbai.maticvigil.com' }),
        // hot wallet variables
        HUMA_PRIVATE_KEY: str({ default: '0785969a6f070bce78c7259252413d3e5099e990c042b27c561d6af59c8e506e' }),
        // wallets
        // default keys are randomly generated on string generators
        LEARN_AND_EARN_PRIVATE_KEY: str({
            default: '3591c95d47c357aaec3dd1803cc0f2236e439366d69b19664a8e6b7a747ea0a2'
        }),
        RECURRING_DONATION_PRIVATE_KEY: str({
            default: '53c4687d6048f9e875049c36fdb466bd1a360e5e9a36965a1f5ff1d32ea45642'
        })
    });
}

export default validateEnv;
