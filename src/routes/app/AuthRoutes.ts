import { Router } from "express";
import { body } from "express-validator";

import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import Auth from "../../Utils/Auth";
import MailHelper from "../../helpers/MailHelper";
import _RS from "../../helpers/ResponseHelper";
import EmailTemplate from "../../models/EmailTemplate";
import Otp, { OtpUseFor } from "../../models/Otp";
import User, { UserTypes } from "../../models/User";

import Helper from "../../helpers/Helper";
import { optional } from "joi";
import NotificationUser from "../../models/NotificationUser";

class AuthRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.apis();
    this.get();
    this.delete();
  }
  public apis() {
    // send OTP
    this.router.post(
      "/send-otp",
      [
        body("mobile_number")
          .optional()
          .notEmpty()
          .withMessage("Valid mobile_number must be provided"),
        body("country_code")
          .optional()
          .notEmpty()
          .withMessage("Valid country_code must be provided"),
        body("email")
          .optional()
          .notEmpty()
          .withMessage("Valid email must be provided"),
        body("use_for")
          .notEmpty()
          .isIn(Object.values(OtpUseFor))
          .withMessage("Valid use_for must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { mobile_number, country_code, email, use_for } = req.body;
          let OTP, otp, user;

          if (use_for == OtpUseFor.SIGNUP) {
            user = await User.findOne({
              mobile_number,
              country_code,
              type: UserTypes.TEACHER,
            });

            if (user)
              return _RS.apiNew(
                res,
                false,
                "Mobile number already used",
                {},
                startTime
              );

            user = await User.findOne({ email, type: UserTypes.TEACHER });

            // if (user) return _RS.apiNew(res, false, "Email already used", {}, startTime);

            otp = 1234;

            const find = await Otp.findOne({
              mobile_number,
              country_code,
              email,
              use_for: OtpUseFor.SIGNUP,
              type: UserTypes.TEACHER,
            });

            if (find) {
              //resend
              find.otp = otp;
            } else {
              await Otp.create({
                mobile_number,
                country_code,
                email,
                otp,
                use_for: OtpUseFor.SIGNUP,
                type: UserTypes.TEACHER,
              });
            }
          } else if (use_for == OtpUseFor.LOGIN) {
            let filter: any = { type: UserTypes.TEACHER, is_delete: false };
            let msg = "Email or mobile number doesn't exist with us";
            if (email) {
              filter.email = email.toLowerCase();
              msg = "Email doesn't exist with us";
            } else if (mobile_number && country_code) {
              filter.mobile_number = mobile_number;
              filter.country_code = country_code;
              msg = "Mobile number doesn't exist with us";
            } else {
              return _RS.apiNew(
                res,
                false,
                "Either email or mobile number must be provided",
                {},
                startTime
              );
            }

            user = await User.findOne(filter);

            if (!user) return _RS.apiNew(res, false, msg, {}, startTime);

            otp = 1234;

            const find = await Otp.findOne({
              mobile_number,
              country_code,
              use_for: OtpUseFor.LOGIN,
              type: UserTypes.TEACHER,
            });

            if (find) {
              //resend
              find.otp = otp;
            } else {
              await Otp.create({ filter, otp, use_for: OtpUseFor.LOGIN });
            }
          } else {
            return _RS.apiNew(
              res,
              false,
              "Something went wrong",
              {},
              startTime
            );
          }

          //Email

          const emailTemplate = await EmailTemplate.findOne({
            slug: "forgot-password",
          });
          console.log("emailTemplate", emailTemplate);

          if (emailTemplate) {
            // let replacedHTML = emailTemplate.description;
            // replacedHTML = replacedHTML.replace("[OTP]", `${otp}`);

            // let replacedArHtml = emailTemplate.ar_description;
            // replacedArHtml = replacedArHtml.replace("[OTP]", `${otp}`);

            // await MailHelper.sendMail(user.email, emailTemplate.subject, replacedHTML, replacedArHtml);

            var replacedHTML = emailTemplate.description;
            replacedHTML = replacedHTML.replace("[NAME]", user?.name || "");
            replacedHTML = replacedHTML.replace("[OTP]", otp || "");

            var replacedArHTML = emailTemplate?.ar_description;
            replacedArHTML = replacedArHTML?.replace(
              "[NAME]",
              user?.name || ""
            );
            replacedArHTML = replacedArHTML?.replace("[OTP]", otp || "");

            await MailHelper.sendMail(
              user?.email,
              emailTemplate.subject,
              replacedHTML,
              replacedArHTML
            );
          }

          // SMS Sent

          // await Helper.sendTwilioWhatsApp({ number: country_code + mobile_number, message: `Otp to verifying your mobile number is ${otp}` })

          // End SMS

          return _RS.apiNew(
            res,
            true,
            "OTP has been sent successfully",
            {},
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );

    // verify OTP
    this.router.post(
      "/verify-otp",
      [
        body("mobile_number")
          .optional()
          .notEmpty()
          .withMessage("Valid mobile_number must be provided"),
        body("country_code")
          .optional()
          .notEmpty()
          .withMessage("Valid country_code must be provided"),
        body("email")
          .optional()
          .notEmpty()
          .withMessage("Valid email must be provided"),
        body("otp").notEmpty().withMessage("Valid otp must be provided"),
        body("use_for")
          .notEmpty()
          .isIn(Object.values(OtpUseFor))
          .withMessage("Valid use_for must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const { mobile_number, country_code, email, otp, use_for, type } =
            req.body;
          let OTP;
          if (use_for == OtpUseFor.SIGNUP) {
            OTP = await Otp.findOne({
              mobile_number,
              country_code,
              email,
              type: UserTypes.TEACHER,
              use_for,
            });

            if (!OTP)
              return _RS.apiNew(
                res,
                false,
                "User not exist with us",
                {},
                startTime
              );

            if (OTP.otp != otp) {
              return _RS.apiNew(
                res,
                false,
                "Invalid OTP, Please enter correct OTP",
                {},
                startTime
              );
            }
          } else if (use_for == OtpUseFor.LOGIN) {
            OTP = await Otp.findOne({
              mobile_number,
              country_code,
              type: UserTypes.TEACHER,
              use_for,
            });

            if (!OTP) {
              return _RS.apiNew(
                res,
                false,
                "Mobile does not exist with us",
                {},
                startTime
              );
            }

            if (OTP.otp != otp) {
              return _RS.apiNew(
                res,
                false,
                "Invalid OTP, Please enter correct OTP",
                {},
                startTime
              );
            }
          }
          //

          OTP.is_used = true;

          await OTP.save();

          return _RS.apiNew(
            res,
            true,
            "OTP has been verified successfully",
            {},
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );

    //Change Password
    this.router.post(
      "/change-password",

      [
        body("old_password")
          .notEmpty()
          .withMessage("Valid old_password must be provided"),
        body("new_password")
          .notEmpty()
          .withMessage("Valid new_password must be provided"),
      ],
      ValidateRequest,
      Authentication.user,
      async (req, res, next) => {
        const startTime = new Date().getTime();
        const { old_password, new_password } = req.body;
        try {
          const admin: any = await User.findById(req.user.id);

          const isPasswordCurrentCorrect = await Auth.comparePassword(
            old_password,
            admin.password
          );

          if (!isPasswordCurrentCorrect) {
            return _RS.apiNew(
              res,
              false,
              "Old password does not match",
              {},
              startTime
            );
          }
          const isSamePassword = await Auth.comparePassword(
            new_password,
            admin.password
          );

          if (isSamePassword) {
            return _RS.apiNew(
              res,
              false,
              "New password cannot be the same as the old password",
              {},
              startTime
            );
          }

          const encryptedPassword = await Auth.encryptPassword(new_password);

          admin.password = encryptedPassword;

          await admin.save();
          return _RS.apiNew(
            res,
            true,
            "Password changed successfully",
            {},
            startTime
          );
        } catch (err) {
          next(err);
        }
      }
    );

    // signup
    this.router.post(
      "/sign-up",
      // Authentication.guest,
      [
        body("sign_up_device")
          .notEmpty()
          .withMessage("Valid sign up device must be provided"),
        body("country_code")
          .notEmpty()
          .withMessage("Valid country_code must be provided"),
        body("mobile_number")
          .notEmpty()
          .withMessage("Valid mobile_number must be provided"),
        body("password")
          .notEmpty()
          .withMessage("Valid password must be provided"),
        body("name")
          .optional()
          .notEmpty()
          .withMessage("Valid name number must be provided"),
        body("email")
          .optional()
          .notEmpty()
          .isEmail()
          .withMessage("Valid email must be provided"),
        body("refer_code")
          .optional()
          .notEmpty()
          .withMessage("Valid refer_code must be provided"),
        body("dob")
          .optional()
          .notEmpty()
          .withMessage("Valid date of birth must be provided"),
        body("gender")
          .optional()
          .notEmpty()
          .withMessage("Valid gender must be provided"),
        body("have_whatsapp")
          .optional()
          .notEmpty()
          .withMessage("Valid have_whatsapp must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const {
            name,
            last_name,
            mobile_number,
            country_code,
            email,
            device_token,
            device_type,
            refer_code,
            have_whatsapp,
            timezone,
            password,
            dob,
            gender,
            image,
            sign_up_device,
            country_id,
          } = req.body;
          let redeemedReferBonus: boolean = false;

          let OTP = await Otp.findOne({
            mobile_number,
            country_code,
            use_for: OtpUseFor.SIGNUP,
          });
          console.log("sign_up_device", sign_up_device);
          if (sign_up_device !== "Web") {
            console.log("OTP", OTP);
            if (!OTP) {
              return _RS.apiNew(res, false, "Otp not verified", {}, startTime);
            }

            if (!OTP.is_used) {
              return _RS.apiNew(res, false, "Otp not verified", {}, startTime);
            }
          }

          const existingUserByEmail = await User.findOne({
            email,
            type: UserTypes.TEACHER,
          });
          const existingUserByPhone = await User.findOne({
            mobile_number,
            country_code,
            type: UserTypes.TEACHER,
          });

          if (existingUserByPhone) {
            return _RS.apiNew(
              res,
              false,
              "Mobile number already used",
              {},
              startTime
            );
          }

          const user = await new User({
            name,
            last_name,
            mobile_number,
            country_code,
            email: email ? email.toLowerCase() : email,
            device_token,
            device_type,
            type: UserTypes.TEACHER,
            have_whatsapp,
            timezone,
            image,
            password: password
              ? await Auth.encryptPassword(password)
              : password,
            dob,
            gender,
            country_id: country_id ? country_id : "646b2e0f46865f1f65565387",
            sign_up_device,
          }).save();

          const createNotification = await NotificationUser.create({
            to_id: "64c7366ec01fae98da0614b5", // Admin Id
            from_id: user._id,
            title: "New User Registration",
            description: `New user has been registered.`,
          });

          if (sign_up_device !== "Web") {
            await Otp.findByIdAndDelete(OTP._id);
          }
          const payload = {
            id: user._id,
            email: user.email,
            type: user.type,
          };

          const token = await Auth.getToken(payload, "1d", next);
          return _RS.apiNew(
            res,
            true,
            "Welcome! SignUp Successfully",
            { user: user, token },
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );

    //login
    this.router.post(
      "/login",
      [
        body("mobile_number")
          .optional()
          .notEmpty()
          .withMessage("Valid mobile_number must be provided"),
        body("country_code")
          .optional()
          .notEmpty()
          .withMessage("Valid country_code must be provided"),
        body("email")
          .optional()
          .notEmpty()
          .withMessage("Valid country_code must be provided"),
        body("password")
          .notEmpty()
          .withMessage("Valid password must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        const startTime = new Date().getTime();

        const {
          country_code,
          mobile_number,
          device_token,
          timezone,
          device_type,
          password,
          email,
        } = req.body;
        try {
          let msg = "Email or mobile number doesn't exist with us";
          let filter: any = { type: UserTypes.TEACHER };
          if (email) {
            filter.email = email.toLowerCase();
            msg = "Email doesn't exist with us";
          } else if (mobile_number && country_code) {
            filter.mobile_number = mobile_number;
            filter.country_code = country_code;
            msg = "Mobile number doesn't exist with us";
          } else {
            return _RS.apiNew(
              res,
              false,
              "Either email or mobile number must be provided",
              {},
              startTime
            );
          }

          let isUserExist = await User.findOne(filter).populate({
            path: "country_id",
            select: "currency currency_symbol currency_name",
          });

          if (!isUserExist) {
            return _RS.apiNew(res, false, msg, {}, startTime);
          }

          if (!isUserExist.is_active) {
            return _RS.apiNew(
              res,
              false,
              "Your Account is blocked",
              {},
              startTime
            );
          }

          if (isUserExist.is_delete) {
            return _RS.apiNew(
              res,
              false,
              "Your Account is deleted",
              {},
              startTime
            );
          }

          const isPasswordValid = await Auth.comparePassword(
            password,
            isUserExist.password
          );

          if (!isPasswordValid) {
            return _RS.apiNew(res, false, "Invalid password", {}, startTime);
          }

          isUserExist.device_token = device_token
            ? device_token
            : isUserExist.device_token;
          isUserExist.device_type = device_type
            ? device_type
            : isUserExist.device_type;
          isUserExist.timezone = timezone ? timezone : isUserExist.timezone;

          await isUserExist.save();
          const payload = {
            id: isUserExist._id,
            email: isUserExist.email,
            type: isUserExist.type,
          };

          const token = await Auth.getToken(payload, "1d", next);
          return _RS.apiNew(
            res,
            true,
            "Welcome! Login Successfully",
            { user: isUserExist, token },
            startTime
          );
        } catch (err) {
          next(err);
        }
      }
    );
  }

  public delete() {
    // delete user
    this.router.delete(
      "/",
      Authentication.user,
      [],
      ValidateRequest,
      async (req, res, next) => {
        const startTime = new Date().getTime();
        try {
          const user = await User.findById(req.user.id);
          if (user.is_delete) {
            return _RS.apiNew(res, true, "User Already Deleted", {}, startTime);
          }
          user.is_delete = true;
          await user.save();

          return _RS.apiNew(
            res,
            true,
            "Your Account Deleted Successfully",
            user,
            startTime
          );
        } catch (error) {
          next(error);
        }
      }
    );
  }

  public post() {
    //update profile
    this.router.post(
      "/profile",
      Authentication.user,
      [
        body("name")
          .optional()
          .notEmpty()
          .withMessage("Valid name  must be provided"),
        body("ar_name")
          .optional()
          .notEmpty()
          .withMessage("Valid ar_name  must be provided"),
        body("dob")
          .optional()
          .notEmpty()
          .withMessage("Valid dob  must be provided"),
        body("country_id")
          .optional()
          .notEmpty()
          .withMessage("Valid country_id  must be provided"),
        body("area")
          .optional()
          .notEmpty()
          .withMessage("Valid country_id  must be provided"),
        body("city_id")
          .optional()
          .notEmpty()
          .withMessage("Valid city_id  must be provided"),
        body("latitude")
          .optional()
          .notEmpty()
          .withMessage("Valid latitude  must be provided"),
        body("longitude")
          .optional()
          .notEmpty()
          .withMessage("Valid longitude  must be provided"),
        body("profession")
          .optional()
          .notEmpty()
          .withMessage("Valid profession  must be provided"),
        body("gender")
          .optional()
          .notEmpty()
          .withMessage("Valid gender  must be provided"),
        body("email")
          .optional()
          .notEmpty()
          .withMessage("Valid email must be required"),
      ],
      ValidateRequest,
      async (req: any, res, next) => {
        const startTime = new Date().getTime();
        const {
          name,
          ar_name,
          dob,
          country_id,
          area,
          city_id,
          latitude,
          longitude,
          profession,
          gender,
          email,
          image,
        } = req.body;
        try {
          if (!!email) {
            const emailExists = await User.findOne({
              _id: { $ne: req.user.id },
              email: new RegExp(`^${email}$`, "i"),
              type: UserTypes.TEACHER,
            });
            if (emailExists) {
              return _RS.apiNew(
                res,
                false,
                "Email Already Exists",
                {},
                startTime
              );
            }
          }
          let user = await User.findOne({
            _id: req.user.id,
          });

          if (!user) {
            return _RS.apiNew(
              res,
              false,
              "User not exist , go to signup page",
              user,
              new Date().getTime()
            );
          }

          user.name = !!name ? name : user.name;
          user.ar_name = !!ar_name ? ar_name : user.ar_name;
          user.dob = !!dob ? dob : user.dob;
          user.country_id = !!country_id ? country_id : user.country_id;
          user.area = !!area ? area : user.area;
          user.city_id = !!city_id ? city_id : user.city_id;
          // user.latitude = !!latitude ? latitude : user.latitude
          // user.longitude = !!longitude ? longitude : user.longitude
          user.profession = !!profession ? profession : user.profession;
          user.gender = !!gender ? gender : user.gender;
          user.email = !!email ? email : user.email;
          user.image = !!image ? image : user.image;

          if (latitude && longitude) {
            user.location = {
              type: "Point",
              coordinates: [longitude, latitude],
            };
          }

          await user.save();

          return _RS.apiNew(
            res,
            true,
            "Update Profile Successfully",
            user,
            startTime
          );
        } catch (error) {
          next(error);
        }
      }
    );

    // change email
    this.router.post(
      "/update/email",
      Authentication.user,
      [
        body("email")
          .notEmpty()
          .isEmail()
          .withMessage("Valid email must be provided"),
      ],
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { email } = req.body;
          const user = await User.findById(req.user.id);
          if (!user.is_active) {
            return _RS.apiNew(res, false, "Account Deactivated", {}, startTime);
          }
          if (user.is_delete) {
            return _RS.apiNew(res, false, "Account Deleted", {}, startTime);
          }

          const existingEmail = await User.findOne({
            email: email,
            type: UserTypes.TEACHER,
          });
          if (existingEmail) {
            return _RS.apiNew(res, false, "Email Already Used", {}, startTime);
          }

          user.email = email;
          await user.save();

          return _RS.apiNew(res, true, "Email Changed", user, startTime);
        } catch (error) {
          next(error);
        }
      }
    );

    //reset password
    this.router.post(
      "/reset-password",
      Authentication.user,
      [
        body("email")
          .notEmpty()
          .isEmail()
          .withMessage("Valid email must be provided"),
        body("password")
          .notEmpty()
          .withMessage("Valid password must be provided"),
      ],
      async (req, res, next) => {
        const { email, password } = req.body;
        const startTime = new Date().getTime();

        try {
          let user = await User.findOne({
            email: email,
          });

          if (!user) {
            let msg = "User not found";
            return _RS.apiNew(res, false, msg, {}, startTime);
          }

          user.password = await Auth.encryptPassword(password);
          await user.save();

          let msg = "Password changed successfully.";
          return _RS.apiNew(res, true, msg, {}, startTime);
        } catch (error) {
          next(error);
        }
      }
    );

    this.router.post(
      "/profile/image",
      Authentication.user,
      [body("image").notEmpty().withMessage("Valid image  must be provided")],
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { image } = req.body;
          const user = await User.findById(req.user.id);
          if (!user.is_active) {
            return _RS.apiNew(res, false, "Account Deactivated", {}, startTime);
          }
          if (user.is_delete) {
            return _RS.apiNew(res, false, "Account Deleted", {}, startTime);
          }

          user.image = image;
          await user.save();

          return _RS.apiNew(
            res,
            true,
            "Profile Image Updated",
            user,
            startTime
          );
        } catch (error) {
          next(error);
        }
      }
    );
  }

  public get() {
    this.router.get(
      "/profile",
      Authentication.user,
      [],
      async (req, res, next) => {
        const startTime = new Date().getTime();
        try {
          const user = await User.findOne({ _id: req.user.id }).populate({
            path: "country_id",
            select: "currency currency_symbol currency_name",
          });

          if (user.is_delete) {
            return _RS.apiNew(res, false, "Deleted Account", {}, startTime);
          }
          if (!user.is_active) {
            return _RS.apiNew(res, false, "Account Deactivated", {}, startTime);
          }

          const userProfile = user?._doc ?? user;

          return _RS.apiNew(
            res,
            true,
            "User Profile Get Successfully",
            { data: userProfile },
            startTime
          );
        } catch (error) {
          next(error);
        }
      }
    );
  }
}

export default new AuthRouter().router;
