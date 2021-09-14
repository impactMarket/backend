export class BaseError extends Error {
    constructor(name: string, message: string) {
        super();

        this.name = name;
        this.message = message;
        Error.captureStackTrace(this);
    }
}
