import * as cache from './cache';
import * as dataFetching from './dataFetching';
import * as jwt from './jwt';
import * as prismic from './prismic';
import * as pushNotification from './pushNotification';
import * as util from './util';
import { BaseError } from './baseError';
import { Logger } from './logger';
import countries from './countries.json';
import locales from './locale.json';

/**
 * format object's values to number if they are numbers in string format
 * like, `{ completed: '0', total: '1' }` to `{ completed: 0, total: 1 }`
 * @param obj object to be formatted
 * @returns formatted object
 */
const formatObjectToNumber = <T extends object>(obj: any): T =>
    Object.entries(obj).reduce((r, [k, v]) => {
        const v_ = Number(v);
        if (!Number.isNaN(v_)) {
            v = v_;
        }
        // eslint-disable-next-line no-sequences
        return (r[k] = v), r;
    }, {}) as unknown as T;

export {
    BaseError,
    countries,
    dataFetching,
    Logger,
    formatObjectToNumber,
    util,
    jwt,
    cache,
    pushNotification,
    prismic,
    locales
};
