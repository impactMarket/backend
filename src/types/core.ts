import { Request } from 'express';
import * as core from 'express-serve-static-core';

export interface UserInRequest {
    address: string;
    userId?: number;
}
export interface RequestWithUser<
    P = core.ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = core.Query
> extends Request<P, ResBody, ReqBody, ReqQuery> {
    user?: UserInRequest;
}
