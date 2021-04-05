import dotenv from 'dotenv';
import { cleanEnv, num, port, str } from 'envalid';

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
    console.log(process.env.NODE_ENV);
    return cleanEnv(process.env, {
        NODE_ENV: str(),
        PORT: port({ devDefault: 500 }),
        DATABASE_URL: str({ devDefault: 'xyz' }),
        CHAIN_JSON_RPC_URL: str({ devDefault: 'xyz' }),
        JWT_SECRET: str({ devDefault: 'xyz' }),
        CUSD_CONTRACT_ADDRESS: str({ devDefault: 'xyz' }),
        IMPACT_MARKET_CONTRACT_ADDRESS: str({ devDefault: 'xyz' }),
        IMPACT_MARKET_CONTRACT_BLOCK: num({ devDefault: 0 }),
        ATTESTATION_PROXY_ADDRESS: str({ devDefault: 'xyz' }),
        AWS_ACCESS_KEY_ID: str({ devDefault: 'xyz' }),
        AWS_SECRET_ACCESS_KEY: str({ devDefault: 'xyz' }),
        AWS_BUCKET_IMAGES_COMMUNITY: str({ devDefault: 'xyz' }),
        AWS_BUCKET_IMAGES_STORY: str({ devDefault: 'xyz' }),
        AWS_REGION: str({ devDefault: 'xyz' }),
        CURRENCIES_API_BASE_URL: str({ devDefault: 'xyz' }),
        CURRENCIES_API_KEY: str({ devDefault: 'xyz' }),
        MASTER_KEY: str({ devDefault: 'xyz' }),
        LATEST_MOBILE_APP_VERSION: str({ devDefault: 'xyz' }),
        MINIMAL_MOBILE_APP_VERSION: str({ devDefault: 'xyz' }),
        LOG_LEVEL: str({ default: 'verbose' }),
        FLEEK_STORAGE_KEY_ID: str({ devDefault: 'xyz' }),
        FLEEK_STORAGE_ACCESS_KEY: str({ devDefault: 'xyz' }),
        COMMUNITY_PLACEHOLDER_IMAGE_URL: str({ devDefault: 'xyz' }),
        API_ENVIRONMENT: str({
            choices: ['development', 'test', 'production', 'staging'],
            devDefault: 'test',
        }),
        CLOUDFRONT_URL: str({ devDefault: 'xyz' }),
        SENTRY_KEY: str({ devDefault: 'xyz' }),
        SENTRY_TRACE_SAMPLES_RATE: num({ default: 0 }),
        ADMIN_KEY: str({ devDefault: 'xyz' }),
        HASH_KEY: str({ devDefault: 'xyz' }),
        REDIS_HOST: str(),
        REDIS_PORT: num(),
        BULL_JOBS_CONCURRENCY: num(),
    });
}

export default validateEnv;
