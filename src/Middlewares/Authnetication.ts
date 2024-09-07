import _RS from "../helpers/ResponseHelper";
import Auth from "../Utils/Auth";
import User, { UserTypes } from "../models/User";
import { getLanguageStrings } from "../locale";
import * as mongoose from "mongoose";

class Authentication {
  constructor() {}

  static async userLanguage(req, res, next) {
    let language = req.headers.language ?? "en";
    const lang = getLanguageStrings(language);
    req.lang = lang;
    next();
  }

  static async user(req, res, next) {
    const startTime = new Date().getTime();
    try {
      let token;

      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return _RS.api(res, false, "Un-Authorized User", {}, startTime);
      }

      const decoded: any = await Auth.decodeJwt(token);
      const currentUser = await User.findOne({
        _id: decoded.id,
        type: UserTypes.TEACHER,
      }).populate({
        path: "country_id",
        select: "currency currency_symbol currency_name",
      });

      if (!currentUser) {
        return _RS.api(
          res,
          false,
          "User doesn't exists with us",
          {},
          startTime
        );
      }

      if (!currentUser.is_active) {
        return _RS.api(
          res,
          false,
          "Account Deactivated Please contact to admin",
          {},
          startTime
        );
      }

      let city_id = currentUser.city_id ?? "6577f988193d842837b2ae99";
      let country_id = currentUser.country_id ?? "646b2e0f46865f1f65565346";

      req.user = currentUser;
      req.user.id = decoded.id;
      next();
    } catch (err) {
      if (err.message == "jwt expired") {
        res.status(403).json({
          status: false,
          statusCode: 403,
          statusText: "JWT_EXPIRED",
          message: "message" ? "JWT_EXPIRED" : "Un-authenticated Request!",
        });
      }
      console.log(err, "errerr");

      return next(err);
    }
  }

  static async guest(req, res, next) {
    const startTime = new Date().getTime();
    try {
      let token;

      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        req.user = {};
        req.user.id = new mongoose.Types.ObjectId();
        return next();
      }

      const decoded: any = await Auth.decodeJwt(token);
      const currentUser = await User.findById(decoded._id);

      if (!currentUser) {
        return _RS.api(
          res,
          false,
          "User doesn't exists with us",
          {},
          startTime
        );
      }

      if (!currentUser.is_active) {
        return _RS.api(
          res,
          false,
          "Account Deactivated Please contact to admin",
          {},
          startTime
        );
      }

      req.user = currentUser;
      req.user.id = decoded.id;
      next();
    } catch (err) {
      if (err.message == "jwt expired") {
        res.status(403).json({
          status: 403,
          statusText: "JWT_EXPIRED",
          message: "message" ? "JWT_EXPIRED" : "Un-authenticated Request!",
        });
      }
      return next(err);
    }
  }

  static async admin(req, res, next) {
    const startTime = new Date().getTime();
    try {
      let token;
      req.country_id = req.headers?.country_id;

      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
      ) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return _RS.unAuthenticated(
          res,
          "UNAUTHORIZED",
          "Un-Authorized",
          {},
          startTime,
          0
        );
      }

      const decoded: any = await Auth.decodeJwt(token);

      const currentUser = await User.findOne({
        _id: decoded.id,
        type: { $in: ["Admin", "Teacher"] },
      });

      if (!currentUser) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Admin doesn't exists with us",
          currentUser,
          startTime
        );
      }

      req.user = currentUser;
      req.user.id = decoded.id;
      req.user.type = decoded.type;
      next();
    } catch (err) {
      if (err.message == "jwt expired") {
        res.status(403).json({
          status: 403,
          statusText: "JWT_EXPIRED",
          message: "message" ? "JWT_EXPIRED" : "Un-authenticated Request!",
        });
      }
      return next(err);
    }
  }
}

export default Authentication;
