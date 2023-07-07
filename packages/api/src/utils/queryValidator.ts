import * as Joi from 'joi';
import * as express from 'express';
import { IncomingHttpHeaders } from 'http';
import { ParsedQs } from 'qs';

/**
 * These are the named properties on an express.Request that this module can
 * validate, e.g "body" or "query"
 */
export enum ContainerTypes {
    Body = 'body',
    Query = 'query',
    Headers = 'headers',
    Fields = 'fields',
    Params = 'params'
}

/**
 * Use this in you express error handler if you've set *passError* to true
 * when calling *createValidator*
 */
export type ExpressJoiError = Joi.ValidationResult & {
    type: ContainerTypes;
};

/**
 * A schema that developers should extend to strongly type the properties
 * (query, body, etc.) of incoming express.Request passed to a request handler.
 */
export type ValidatedRequestSchema = Record<ContainerTypes, any>;

/**
 * Use this in conjunction with *ValidatedRequestSchema* instead of
 * express.Request for route handlers. This ensures *req.query*,
 * *req.body* and others are strongly typed using your
 * *ValidatedRequestSchema*
 */
export interface ValidatedRequest<T extends ValidatedRequestSchema> extends express.Request {
    body: T[ContainerTypes.Body];
    query: T[ContainerTypes.Query] & ParsedQs;
    headers: T[ContainerTypes.Headers];
    params: T[ContainerTypes.Params];
}

/**
 * Use this in conjunction with *ValidatedRequestSchema* instead of
 * express.Request for route handlers. This ensures *req.query*,
 * *req.body* and others are strongly typed using your *ValidatedRequestSchema*
 *
 * This will also allow you to access the original body, params, etc. as they
 * were before validation.
 */
export interface ValidatedRequestWithRawInputsAndFields<T extends ValidatedRequestSchema> extends express.Request {
    body: T[ContainerTypes.Body];
    query: T[ContainerTypes.Query];
    headers: T[ContainerTypes.Headers];
    params: T[ContainerTypes.Params];
    fields: T[ContainerTypes.Fields];
    originalBody: any;
    originalQuery: any;
    originalHeaders: IncomingHttpHeaders;
    originalParams: any;
    originalFields: any;
}

/**
 * Configuration options supported by *createValidator(config)*
 */
export interface ExpressJoiConfig {
    statusCode?: number;
    passError?: boolean;
    joi?: object;
}

/**
 * Configuration options supported by middleware, e.g *validator.body(config)*
 */
export interface ExpressJoiContainerConfig {
    joi?: Joi.ValidationOptions;
    statusCode?: number;
    passError?: boolean;
}

/**
 * A validator instance that can be used to generate middleware. Is returned by
 * calling *createValidator*
 */
export interface ExpressJoiInstance {
    body(schema: Joi.Schema, cfg?: ExpressJoiContainerConfig): express.RequestHandler;
    query(schema: Joi.Schema, cfg?: ExpressJoiContainerConfig): express.RequestHandler;
    params(schema: Joi.Schema, cfg?: ExpressJoiContainerConfig): express.RequestHandler;
    headers(schema: Joi.Schema, cfg?: ExpressJoiContainerConfig): express.RequestHandler;
    fields(schema: Joi.Schema, cfg?: ExpressJoiContainerConfig): express.RequestHandler;
    response(schema: Joi.Schema, cfg?: ExpressJoiContainerConfig): express.RequestHandler;
}

// These represent the incoming data containers that we might need to validate
const containers = {
    query: {
        storageProperty: 'originalQuery',
        joi: {
            convert: true,
            allowUnknown: false,
            abortEarly: false
        }
    },
    // For use with body-parser
    body: {
        storageProperty: 'originalBody',
        joi: {
            convert: true,
            allowUnknown: false,
            abortEarly: false
        }
    },
    headers: {
        storageProperty: 'originalHeaders',
        joi: {
            convert: true,
            allowUnknown: true,
            stripUnknown: false,
            abortEarly: false
        }
    },
    // URL params e.g "/users/:userId"
    params: {
        storageProperty: 'originalParams',
        joi: {
            convert: true,
            allowUnknown: false,
            abortEarly: false
        }
    },
    // For use with express-formidable or similar POST body parser for forms
    fields: {
        storageProperty: 'originalFields',
        joi: {
            convert: true,
            allowUnknown: false,
            abortEarly: false
        }
    }
};

function buildErrorString(err, container) {
    let ret = `Error validating ${container}.`;
    const details = err.error.details;

    for (let i = 0; i < details.length; i++) {
        ret += ` ${details[i].message}.`;
    }

    return ret;
}

export function createValidator(config?: ExpressJoiConfig): ExpressJoiInstance {
    const cfg = config || {}; // default to an empty config
    // We'll return this instance of the middleware
    const instance = {
        response
    };

    Object.keys(containers).forEach(type => {
        // e.g the "body" or "query" from above
        const container = containers[type];

        instance[type] = function (schema: Joi.Schema, options?: ExpressJoiContainerConfig) {
            const opts = options || {}; // like config, default to empty object
            const computedOpts = { ...container.joi, ...cfg.joi, ...opts.joi };
            return function expressJoiValidator(
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ) {
                const ret = schema.validate(req[type], computedOpts) as any;

                if (!ret.error) {
                    req[container.storageProperty] = req[type];
                    req[type] = ret.value;
                    next();
                } else if (opts.passError || cfg.passError) {
                    ret.type = type;
                    next(ret);
                } else {
                    res.status(opts.statusCode || cfg.statusCode || 400).end(buildErrorString(ret, `request ${type}`));
                }
            };
        };
    });

    return instance as any;

    function response(schema, options) {
        const opts = options || {}; // like config, default to empty object
        const type = 'response';
        return (req, res, next) => {
            const resJson = res.json.bind(res);
            res.json = validateJson;
            next();

            function validateJson(json) {
                const ret = schema.validate(json, opts.joi);
                const { error, value } = ret;
                if (!error) {
                    // return res.json ret to retain express compatibility
                    return resJson(value);
                } else if (opts.passError || cfg.passError) {
                    ret.type = type;
                    next(ret);
                } else {
                    res.status(opts.statusCode || cfg.statusCode || 500).end(buildErrorString(ret, `${type} json`));
                }
            }
        };
    }
}
