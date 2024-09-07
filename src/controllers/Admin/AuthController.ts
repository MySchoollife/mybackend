import User from "../../models/User";
import _RS from "../../helpers/ResponseHelper";
import Auth from "../../Utils/Auth";
import MailHelper from "../../helpers/MailHelper";
import EmailTemplate from "../../models/EmailTemplate";
import AppSetting from "../../models/AppSetting";
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());
export class AuthController {
  static async login(req, res, next) {
    const startTime = new Date().getTime();

    const { email, password, device_token, device_type } = req.body;
    try {
      let isUserExist = await User.findOne({
        email: email.toLowerCase(),
        type: { $in: ["Admin", "Teacher"] },
      });
      if (!isUserExist) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Email address doesn't exists with us",
          isUserExist,
          startTime
        );
      }

      if (!isUserExist.is_active) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Your Account is blocked",
          isUserExist,
          startTime
        );
      }

      const isPasswordValid = await Auth.comparePassword(
        password,
        isUserExist.password
      );

      // if (!isPasswordValid) {
      //   return _RS.badRequest(
      //     res,
      //     "BADREQUEST",
      //     "Invalid password",
      //     {},
      //     startTime
      //   );
      // }

      isUserExist.device_token = device_token
        ? device_token
        : isUserExist.device_token;
      isUserExist.device_type = device_type
        ? device_type
        : isUserExist.device_type;

      await isUserExist.save();
      const payload = {
        id: isUserExist._id,
        email: isUserExist.email,
        type: isUserExist.type,
      };

      const token = await Auth.getToken(payload, "1d", next);
      return _RS.ok(
        res,
        "SUCCESS",
        "Welcome! Login Successfully",
        { user: isUserExist, token },
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async signUp(req, res, next) {
    const startTime = new Date().getTime();
    const { email, password, name, country_code, mobile_number } = req.body;
    try {
      let user = await User.findOne({
        $and: [{ email: email }, { type: "Admin" }],
      });
      if (!user) {
        user = await User.create({
          email: "developer_house@yopmail.com",
          password: await Auth.encryptPassword("Test@123"),
          name: "Developer House",
          country_code: "91",
          type: "Admin",
          mobile_number: "534656456546",
        });
        return _RS.created(res, "CREATED", "SignUp Successfully");
      }
      return _RS.conflict(
        res,
        "CONFLICT",
        "User already exist with this email",
        user,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req, res, next) {
    const startTime = new Date().getTime();
    try {
      let getAdmin = await User.findOne({
        _id: req.user.id,
      }).populate([{ path: "city_ids" }, { path: "role_id" }]);

      if (!getAdmin) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "User not exist, go to signup page",
          getAdmin,
          startTime
        );
      }
      return _RS.ok(
        res,
        "SUCCESS",
        "Get Profile Successfully",
        getAdmin,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    const startTime = new Date().getTime();
    const { old_password, new_password } = req.body;
    try {
      const admin: any = await User.findById(req.user.id);

      const isPasswordCurrentCorrect = await Auth.comparePassword(
        old_password,
        admin.password
      );

      if (!isPasswordCurrentCorrect) {
        return _RS.badRequest(
          res,
          "BADREQUEST",
          "Old password does not match",
          {},
          startTime
        );
        // return next(
        //   new AppError("Old password does not match", RESPONSE.HTTP_BAD_REQUEST)
        // );
      }
      const isSamePassword = await Auth.comparePassword(
        new_password,
        admin.password
      );

      if (isSamePassword) {
        return _RS.badRequest(
          res,
          "BADREQUEST",
          "New password cannot be the same as the old password",
          {},
          startTime
        );
      }

      const encryptedPassword = await Auth.encryptPassword(new_password);

      admin.password = encryptedPassword;

      await admin.save();
      return _RS.ok(
        res,
        "SUCCESS",
        "Password changed successfully",
        {},
        startTime
      );
      // res.status(RESPONSE.HTTP_OK).json({
      //   status: RESPONSE.HTTP_OK,

      //   message: "Password changed successfully",

      //   data: {},
      // });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    const startTime = new Date().getTime();
    const {
      email,
      name,
      image,
      bio,
      dob,
      gender,
      pincode,
      city_id,
      state_id,
      country_id,
      address,
      website_url,
      mobile_number,
      country_code,
    } = req.body;
    try {
      let getAdmin = await User.findOne({
        _id: req.user.id,
      });

      if (!getAdmin) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "User not exist , go to signup page",
          getAdmin,
          new Date().getTime()
        );
      }

      //about us
      getAdmin.bio = bio ? bio : getAdmin.bio;
      getAdmin.gender = gender ? gender : getAdmin.gender;
      //contact
      getAdmin.name = name ? name : getAdmin.name;
      getAdmin.email = email ? email : getAdmin.email;
      getAdmin.pincode = pincode ? pincode : getAdmin.pincode;
      getAdmin.city_id = city_id ? city_id : getAdmin.city_id;
      getAdmin.state_id = state_id ? state_id : getAdmin.state_id;
      getAdmin.country_id = country_id ? country_id : getAdmin.country_id;
      getAdmin.address = address ? address : getAdmin.address;
      getAdmin.website_url = website_url ? website_url : getAdmin.website_url;
      getAdmin.mobile_number = mobile_number
        ? mobile_number
        : getAdmin.mobile_number;
      getAdmin.country_code = country_code
        ? country_code
        : getAdmin.country_code;
      getAdmin.dob = dob ? dob : getAdmin.dob;
      getAdmin.image = image ? image : getAdmin.image;
      await getAdmin.save();

      return _RS.ok(
        res,
        "SUCCESS",
        "Update Profile Successfully",
        getAdmin,
        startTime
      );
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    const email = req.body.email;
    try {
      let admin = await User.findOne({
        email: email,
        type: { $in: ["Admin", "SubAdmin"] },
      });

      if (!admin) {
        let msg = "Email address is not exists with us. Please check again";
        return _RS.notFound(res, "SUCCESS", msg, admin, new Date().getTime());
      }
      const otp = await Auth.generateOtp();
      admin.otp = otp?.otp;
      await admin.save();

      var emailTemplate = await EmailTemplate.findOne({
        slug: "forgot-password",
      });

      var replacedHTML = emailTemplate.description;
      replacedHTML = replacedHTML.replace("[NAME]", admin.name || "");
      replacedHTML = replacedHTML.replace("[OTP]", admin.otp || "");

      var replacedArHTML = emailTemplate?.ar_description;
      replacedArHTML = replacedArHTML?.replace("[NAME]", admin.name || "");
      replacedArHTML = replacedArHTML?.replace("[OTP]", admin.otp || "");

      await MailHelper.sendMail(
        admin.email,
        emailTemplate.subject,
        replacedHTML,
        replacedArHTML
      );

      return _RS.ok(
        res,
        "SUCCESS",
        "OTP has been sent to your email, please check your inbox",
        {},
        new Date().getTime()
      );
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req, res, next) {
    const email = req.body.email;
    const otp = req.body.otp;
    try {
      let admin = await User.findOne({
        email: email,
        type: { $in: ["Admin", "SubAdmin"] },
      });

      if (!admin) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "not found",
          {},
          new Date().getTime()
        );
      }
      console.log("admin.otp", admin.otp, "otp", otp);
      if (admin.otp != otp)
        return _RS.badRequest(
          res,
          "BADREQUEST",
          "Invalid OTP",
          {},
          new Date().getTime()
        );

      admin.otp = null;
      admin.otp_expiry_time = null;
      admin.save();
      return _RS.ok(
        res,
        "SUCCESS",
        "OTP verified successfully",
        {},
        new Date().getTime()
      );
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    const { email, password } = req.body;
    try {
      let user = await User.findOne({
        email: email,
        type: { $in: ["Admin", "SubAdmin"] },
      });

      if (!user) {
        let msg = "User not found";
        return _RS.notFound(res, "notFound", msg, {}, new Date().getTime());
      }

      user.password = await Auth.encryptPassword(password);
      await user.save();

      let msg = "Password changed successfully.";
      return _RS.ok(res, "SUCCESS", msg, {}, new Date().getTime());
    } catch (error) {
      next(error);
    }
  }

  static async updateAppSetting(req, res, next) {
    const startTime = new Date().getTime();
    const {
      app_store_url,
      play_store_url,
      android_version,
      ios_version,
      android_share_content,
      ios_share_content,
    } = req.body;
    try {
      let getSetting = await AppSetting.findById("64cb2e4e865bceaa113a6139");

      if (!getSetting) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Setting not found",
          getSetting,
          startTime
        );
      }

      (getSetting.app_store_url = app_store_url
        ? app_store_url
        : getSetting.app_store_url),
        (getSetting.play_store_url = play_store_url
          ? play_store_url
          : getSetting.play_store_url),
        (getSetting.android_version = android_version
          ? android_version
          : getSetting.android_version),
        (getSetting.ios_version = ios_version
          ? ios_version
          : getSetting.ios_version),
        (getSetting.android_share_content = android_share_content
          ? android_share_content
          : getSetting.android_share_content),
        (getSetting.ios_share_content = ios_share_content
          ? ios_share_content
          : getSetting.ios_share_content),
        getSetting.save();

      return _RS.ok(
        res,
        "SUCCESS",
        "App setting has been successfully",
        getSetting,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }
}
