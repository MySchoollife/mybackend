import { ResInterface } from "../interfaces/RequestInterface";

class ResponseHelper {
  public async ok(res: any, statusText: string, message: any, data: any, startTime: any) {
    try {

      let exeTime = await this.execTime(startTime);
      data = Array.isArray(data) ? { data } : data;
      res.status(200).json({
        status: 200,
        statusText: statusText ? statusText : "SUCCESS",
        message: message,
        data: data,
        exeTime,
      });
    } catch (err) {
      console.log(err);
    }
  }


  public async api(res: any, status: boolean, message: any, data: any, startTime: any) {
    try {

      let exeTime = await this.execTime(startTime);
      data = Array.isArray(data) ? data : data;
      res.status(200).json({
        status: status,
        message: message,
        data: data,
        exeTime,
      });
    } catch (err) {

    }
  }

  public async apiNew(res: any, status: boolean, message: any, data: any, startTime: any) {
    try {
      let exeTime = await this.execTime(startTime);
      data = Array.isArray(data) ? data : data;
      res.status(200).json({
        status: status,
        message: message,
        ...data,
        exeTime,
      });
    } catch (err) {

    }
  }

  public async apiNotFound(res: any, status: boolean, message: any, data: any, startTime: any) {
    try {
      let exeTime = await this.execTime(startTime);
      data = Array.isArray(data) ? data : data;
      // res.status(404).json({ 
      res.status(500).json({
        status: status,
        message: message,
        ...data,
        exeTime,
      });
    } catch (err) {

    }
  }

  public async badRequest(res: any, statusText: string, message: any, data: any = {}, startTime: any) {
    try {
      let exeTime = await this.execTime(startTime);
      res.status(400).json({
        status: 400,
        statusText: statusText ? statusText : "BAD_REQUEST",
        message: message,
        data: data,
        exeTime,
      });
    } catch (err) {

    }
  }
  public async notAcceptable(
    res: any,
    statusText: string,
    message: any,
    data: any = {},
    startTime: any
  ) {
    try {
      let exeTime = await this.execTime(startTime);
      res.status(406).json({
        status: 406,
        statusText: statusText ? statusText : "NOT_ACCEPTABLE",
        message: message,
        data: data,
        exeTime,
      });
    } catch (err) {

    }
  }

  public async conflict(
    res: any,
    statusText: string,
    message: any,
    data: any = {},
    startTime: any
  ) {
    try {

      let exeTime = await this.execTime(startTime);
      res.status(409).json({
        status: 409,
        statusText: statusText ? statusText : "CONFLICT",
        message: message,
        data: data,
        exeTime,
      });
    } catch (error) {

    }
  }

  public async noContent(
    res: any,
    statusText: string,
    message: any,
    data: any = {}
  ) {
    try {
      res.status(200).json({
        status: 205,
        statusText: statusText ? statusText : "",
        message: message ? message : "Un-authenticated Request!",
        data: data,
      });
    } catch (error) {

    }
  }
  public async unAuthenticated(
    res: any,
    statusText: string,
    message: any = null,
    data: any = {},
    startTime: any,
    wrongAttempt: any
  ) {
    try {
      let exeTime = await this.execTime(startTime);
      res.status(401).json({
        status: 401,
        statusText: statusText ? statusText : "UNAUTHORIZE",
        message: message ? message : "Un-authenticated Request!",
        data: data,
        exeTime,
        wrongAttempt,
      });
    } catch (error) {

    }
  }

  public async notFound(
    res: any,
    statusText: string,
    message: any = null,
    data: any = {},
    startTime: any
  ) {
    try {
      let exeTime = await this.execTime(startTime);
      // res.status(404).json({
      res.status(500).json({
        status: 500,
        statusText: statusText ? statusText : "NOTFOUND",
        message: message ? message : "Not Found",
        data: data,
        exeTime,
      });
    } catch (error) {

    }
  }

  public async unAuthorize(
    res: any,
    statusText: string,
    message: any = null,
    data: any = {},
    startTime: any
  ) {
    try {
      let exeTime = await this.execTime(startTime);
      res.status(403).json({
        status: 403,
        statusText: statusText ? statusText : "UNAUTHORIZE",
        message: message ? message : "Un-authenticated Request!",
        data: data,
        exeTime,
      });
    } catch (error) {

    }
  }

  public async serverError(res: any, message: string = null, data: any = {}) {
    try {
      let exeTime = await this.execTime(res);
      res.status(500).json({
        status: 500,
        message: message ? message : "Internal Server Error!",
        data: data,
        exeTime,
      });
    } catch (error) {

    }
  }

  public async created(
    res: any,
    statusText: string,
    message: any = null,
    data: any = {}
  ) {
    try {
      res.status(201).json({
        status: 201,
        statusText: statusText ? statusText : "CREATED",
        message: message ? message : "created!",
        data: data,
      });
    } catch (error) {

    }
  }

  public async acceptanceRequired(
    res: any,
    statusText: string,
    message: any = null,
    data: any = {}
  ) {
    try {
      res.status(406).json({
        status: 406,
        statusText: statusText ? statusText : "FAILED",
        message: message ? message : "created!",
        data: data,
      });
    } catch (error) {

    }
  }

  private async execTime(res: any): Promise<any> {
    // return new Date().getTime() - res.startTime;
    return new Date().getTime() - res;
  }
  private async tracking(tempt: number): Promise<any> {
    return +tempt;
  }
}

export default new ResponseHelper();
