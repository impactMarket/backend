import { cleanEnv, num, port, str, testOnly } from 'envalid';
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

function validateEnv() {
    return cleanEnv(process.env, {
        NODE_ENV: str(),
        PORT: port(),
        DATABASE_URL: str(),
        CHAIN_JSON_RPC_URL: str(),
        JWT_SECRET: str(),
        CUSD_CONTRACT_ADDRESS: str(),
        IMPACT_MARKET_CONTRACT_ADDRESS: str(),
        IMPACT_MARKET_CONTRACT_BLOCK: num(),
        ATTESTATION_PROXY_ADDRESS: str(),
        AWS_ACCESS_KEY_ID: str(),
        AWS_SECRET_ACCESS_KEY: str(),
        AWS_BUCKET_IMAGES_COMMUNITY: str(),
        AWS_BUCKET_IMAGES_STORY: str(),
        AWS_REGION: str(),
        CURRENCIES_API_BASE_URL: str(),
        CURRENCIES_API_KEY: str(),
        MASTER_KEY: str(),
        LATEST_MOBILE_APP_VERSION: str(),
        MINIMAL_MOBILE_APP_VERSION: str(),
        LOG_LEVEL: str({ default: 'verbose' }),
        FLEEK_STORAGE_KEY_ID: str(),
        FLEEK_STORAGE_ACCESS_KEY: str(),
        COMMUNITY_PLACEHOLDER_IMAGE_URL: str(),
        API_ENVIRONMENT: str({
            choices: ['development', 'test', 'production', 'staging'],
        }),
        CLOUDFRONT_URL: str(),
        SENTRY_KEY: str({ devDefault: testOnly('') }),
        SENTRY_TRACE_SAMPLES_RATE: num({ default: 0 }),
        ADMIN_KEY: str(),
        HASH_KEY: str(),
    });
}

export default validateEnv;
