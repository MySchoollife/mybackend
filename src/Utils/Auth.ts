import * as Bcrypt from "bcrypt";
import * as Jwt from "jsonwebtoken";
import path = require("path");



class Auth {
  constructor() {
  }
  public MAX_TOKEN_TIME = 600000;

   async generateOtp(size: number = 4) {
    const currentTime = new Date().getTime();
    const next10min = currentTime + 10 * 60 * 1000;
    const otpExpiresTime = new Date(next10min);

    let otp = "";
    let val;
    val = Math.floor(1000 + Math.random() * 9000);
    val = String(val);
    otp = val.substring(0, 4);

    const otpData = {
      otp: parseInt(otp),
      otpExpiresTime: otpExpiresTime,
    };

    return otpData;
  }

  async decodeJwt(token) {
    return new Promise((resolve, reject) => {
      Jwt.verify(token, process.env.JWT_SECRET ?? 'planit', (err, data) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(data);
        }
      });
    });
  }

   async getToken(data, expiresIn, next) {
    try {
      return Jwt.sign(data, process.env.JWT_SECRET ?? "planit", {
        expiresIn,
      });
    } catch (err) {
      return next(err);
    }
  }
  
   async comparePassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      Bcrypt.compare(candidatePassword, userPassword, (err, isSame) => {
        if (err) {
          reject(err);
        } else if (!isSame) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  async encryptPassword(password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      Bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  }
}
let respObj = new Auth();
export default respObj;


