import { Request, Response } from 'express';

export interface ReqInterface extends Request {
    startTime: number;
    errorStatus: number;
    userData: any
}


/**
 * @interface
 * 
 */
export interface ResInterface extends Response {
    /**
     * @type {(message: string) => string} translation message
     */
    __: (message: string) => string;
    logMsg: string;
    startTime: number;
    api: string;
    method: string;
}

