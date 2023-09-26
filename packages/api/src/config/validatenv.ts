import { bool, cleanEnv, num, port, str } from 'envalid';
import dotenv from 'dotenv';

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
}

function onlyOnTestEnv(testDefault: any) {
    return process.env.NODE_ENV === 'test' ? testDefault : undefined;
}

function validateEnv() {
    return cleanEnv(process.env, {
        NODE_ENV: str(),
        PORT: port({ devDefault: onlyOnTestEnv(5000) }),
        DATABASE_URL: str(),
        CHAIN_JSON_RPC_URL: str({
            devDefault: onlyOnTestEnv('http://localhost:8545')
        }),
        CHAIN_JSON_RPC_URL_FALLBACK: str({
            devDefault: onlyOnTestEnv('http://localhost:8545')
        }),
        JWT_SECRET: str({ devDefault: onlyOnTestEnv('xyz') }),
        CUSD_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        REFERRAL_LINK_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        IMPACT_MARKET_CONTRACT_ADDRESS: str({
            devDefault: onlyOnTestEnv('xyz')
        }),
        IMPACT_MARKET_CONTRACT_BLOCK: num({ devDefault: 0 }),
        ATTESTATION_PROXY_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        // aws config
        AWS_ACCESS_KEY_ID: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_SECRET_ACCESS_KEY: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_REGION: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_BUCKET_APP: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_BUCKET_MICROCREDIT: str({ devDefault: onlyOnTestEnv('xyz') }),
        //
        CLAIM_VERIFICATION: bool({ default: false }),
        LOG_LEVEL: str({ default: 'warn' }),
        API_ENVIRONMENT: str({
            choices: ['development', 'test', 'production', 'staging'],
            devDefault: 'test'
        }),
        CLOUDFRONT_URL: str({ devDefault: onlyOnTestEnv('xyz') }),
        REDIS_URL: str({ devDefault: 'redis://localhost:6379' }),
        STORY_CRON_ACTIVE: bool({ default: false }),
        SLACK_API: str({ default: 'xyz' }),
        SENDGRID_API_KEY: str({ default: 'xyz' }),
        HAS_REDIS_TLS: bool({ default: true }),
        MAX_REQUEST_PER_USER: num({ default: 900 }),
        HUBSPOT_KEY: str({ devDefault: 'xyz' }),
        DAO_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        COMMUNITY_ADMIN_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
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
        LEARN_AND_EARN_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_LAMBDA: bool({ default: false }),
        SIGNATURE_EXPIRATION: num({ default: 15 }),
        ADMIN_AUTHORISED_ADDRESSES: str({ default: '' }),
        SUBGRAPH_URL: str({ devDefault: onlyOnTestEnv('xyz') }),
        // attestation service (ASv2)
        ATTESTATION_ISSUER_PRIVATE_KEY: str({
            devDefault: onlyOnTestEnv('xyz')
        }),
        ATTESTATION_DEK_PRIVATE_KEY: str({ devDefault: onlyOnTestEnv('xyz') }),
        ATTESTATION_ODIS_PROXY: str({ devDefault: onlyOnTestEnv('xyz') }),
        ATTESTATION_FEDERATED_ATTESTATIONS_PROXY: str({ default: '0x0' }),
        ATTESTATION_ISSUER_ADDRESS_CLIENT2: str({ default: '0x0' }),
        // twilio
        TWILIO_ACCOUNT_SID: str({ devDefault: onlyOnTestEnv('xyz') }),
        TWILIO_AUTH_TOKEN: str({ devDefault: onlyOnTestEnv('xyz') }),
        TWILIO_FROM_NUMBER: str({ devDefault: onlyOnTestEnv('xyz') }),
        // chain
        CHAIN_IS_MAINNET: bool({ devDefault: true }),
        CHAIN_JSON_RPC_URL_CELO: str({ devDefault: onlyOnTestEnv('xyz') }),
        // hot wallets
        HOT_WALLET_CHECK_BALANCE: str({ devDefault: onlyOnTestEnv('xyz') }),
        // signers
        SIGNERS_REFERRAL_LINK: str({ devDefault: onlyOnTestEnv('xyz') })
    });
}

export default validateEnv;
