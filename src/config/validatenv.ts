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

function onlyOnTestEnv(testDefault: any) {
    return process.env.NODE_ENV === 'test' ? testDefault : undefined;
}

function validateEnv() {
    return cleanEnv(process.env, {
        NODE_ENV: str(),
        PORT: port({ devDefault: onlyOnTestEnv(5000) }),
        DATABASE_URL: str(),
        CHAIN_JSON_RPC_URL: str({ devDefault: onlyOnTestEnv('xyz') }),
        JWT_SECRET: str({ devDefault: onlyOnTestEnv('xyz') }),
        CUSD_CONTRACT_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        IMPACT_MARKET_CONTRACT_ADDRESS: str({
            devDefault: onlyOnTestEnv('xyz'),
        }),
        IMPACT_MARKET_CONTRACT_BLOCK: num({ devDefault: 0 }),
        ATTESTATION_PROXY_ADDRESS: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_ACCESS_KEY_ID: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_SECRET_ACCESS_KEY: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_BUCKET_COMMUNITY_COVER: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_BUCKET_COMMUNITY_LOGO: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_BUCKET_IMAGES_STORY: str({ devDefault: onlyOnTestEnv('xyz') }),
        AWS_REGION: str({ devDefault: onlyOnTestEnv('xyz') }),
        CURRENCIES_API_BASE_URL: str({ devDefault: onlyOnTestEnv('xyz') }),
        CURRENCIES_API_KEY: str({ devDefault: onlyOnTestEnv('xyz') }),
        MASTER_KEY: str({ devDefault: onlyOnTestEnv('xyz') }),
        LATEST_MOBILE_APP_VERSION: str({ devDefault: onlyOnTestEnv('0.0.0') }),
        MINIMAL_MOBILE_APP_VERSION: str({ devDefault: onlyOnTestEnv('0.0.1') }),
        LOG_LEVEL: str({ default: 'verbose' }),
        FLEEK_STORAGE_KEY_ID: str({ devDefault: onlyOnTestEnv('xyz') }),
        FLEEK_STORAGE_ACCESS_KEY: str({ devDefault: onlyOnTestEnv('xyz') }),
        COMMUNITY_PLACEHOLDER_IMAGE_URL: str({
            devDefault: onlyOnTestEnv('xyz'),
        }),
        API_ENVIRONMENT: str({
            choices: ['development', 'test', 'production', 'staging'],
            devDefault: 'test',
        }),
        CLOUDFRONT_URL: str({ devDefault: onlyOnTestEnv('xyz') }),
        SENTRY_KEY: str({ devDefault: onlyOnTestEnv('xyz') }),
        SENTRY_TRACE_SAMPLES_RATE: num({ default: 0 }),
        ADMIN_KEY: str({ devDefault: onlyOnTestEnv('xyz') }),
        HASH_KEY: str({ devDefault: onlyOnTestEnv('xyz') }),
    });
}

export default validateEnv;
