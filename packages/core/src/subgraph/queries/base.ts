import crypto from 'crypto';

export const hashRedisKey = (key: string) => crypto.createHash('sha1').update(key.replaceAll(' ', '')).digest('base64');
