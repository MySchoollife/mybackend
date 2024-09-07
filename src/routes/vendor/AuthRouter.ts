import { Router } from "express";
import * as mongoose from "mongoose";
import { body } from "express-validator";
import { query } from "express-validator";
import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import Auth from "../../Utils/Auth";
import { AuthController } from "../../controllers/Admin/AuthController";
import MailHelper from "../../helpers/MailHelper";
import _RS from "../../helpers/ResponseHelper";
import EmailTemplate from "../../models/EmailTemplate";
import Otp, { OtpUseFor } from "../../models/Otp";
import Provider from "../../models/Provider";
import User, { UserTypes } from "../../models/User";
import Helper from "../../helpers/Helper";

import AvailabilityProvider from "../../models/AvailabilityProvider";
import ServiceCountry from "../../models/ServiceCountry";
import ProviderProfile from "../../models/ProviderProfile";

class AuthRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.put();
    this.post();
    this.get();
  }

  public put() {
    this.router.put(
      "/language-update",
      Authentication.vendor,
      [
        body("language")
          .notEmpty()
          .withMessage("Valid language  must be provided"),
      ],
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { language } = req.body;
          const user = await User.findById(req.user.id);
          user.user_language = language;
          await user.save();
          return _RS.api(
            res,
            true,
            "Language Updated Successfully",
            {},
            startTime
          );
        } catch (error) {
          next(error);
        }
      }
    );
  }

  public post() {
    this.router.post("/login", async (req, res, next) => {
      const startTime = new Date().getTime();

      const { country_code, mobile_number, password, device_token, device_type, timezone } = req.body;
      try {
        let isUserExist = await User.findOne({
          mobile_number: mobile_number?.trim(),
          country_code: country_code?.trim(),
          type: "Vendor",
        })

        if (!isUserExist) {
          return _RS.notFound(
            res,
            "NOTFOUND",
            "Mobile number doesn't exists with us",
            isUserExist,
            startTime
          );
        }

        if (!isUserExist.is_active) {
          return _RS.badRequest(
            res,
            "Blocked",
            "Your Account is blocked",
            isUserExist,
            startTime
          );
        }

        if (isUserExist.is_delete) {
          return _RS.apiNew(res, false, "Your Account is deleted", isUserExist, startTime);
        }

        if (!isUserExist.is_otp_verify) {
          return _RS.badRequest(res, "false", "Your Account is not verified! An OTP has been sent to your mobile", {}, startTime);
        }

        const isPasswordValid = await Auth.comparePassword(
          password,
          isUserExist.password
        );

        if (!isPasswordValid) {
          return _RS.badRequest(
            res,
            "BADREQUEST",
            "Invalid password",
            {},
            startTime
          );
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
          mobile_number: isUserExist.mobile_number,
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
    });

    this.router.post(
      "/change-password",
      // Authentication.vendor,
      async (req: any, res, next) => {
        const startTime = new Date().getTime();
        const { old_password, new_password, user_id } = req.body;
        try {
          const admin: any = await User.findById(user_id);

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
    );

    this.router.post(
      "/update-profile",
      Authentication.vendor,
      [],
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const restaurant = await Provider.findById(id);

          if (!restaurant) {
            return _RS.apiNew(res, false, "Provider not found", {}, startTime);
          }

          const {
            eventtype_id,
            twitter_link,
            facebook_link,
            instagram_link,
            website_url,
            cover_photo,
            number_of_service,
            images_per_service,
            mobile_number_sec,
            country_code_sec,
            have_whatsapp,
            have_whatsapp_sec,
            auto_accept_order,
            associated_manager,
            name,
            ar_name,
            logo,
            category_id,
            delivery_time,
            delivery_type,
            min_order_price,
            approx_delivery_time,
            description,
            ar_description,
            tax,
            commission_rate,
            business_id,
            working_days,
            contact_person_name,
            mobile_number,
            country_code,
            sub_category_id,
            email,
            password,
            address,
            ar_address,
            city,
            country,
            area,
            latitude,
            longitude,
            image,
            document,
            map_address,
            device_type,
            city_id,
            country_id,
            profile_id,
            values,
            packages,
            services
          } = req.body;

          let fieldsToCount = [
            cover_photo,
            images_per_service,
            number_of_service,
            map_address,
            mobile_number_sec,
            country_code_sec,
            have_whatsapp,
            have_whatsapp_sec,
            auto_accept_order,
            name,
            ar_name,
            logo,
            category_id,
            delivery_time,
            min_order_price,
            approx_delivery_time,
            description,
            ar_description,
            tax,
            commission_rate,
            business_id,
            contact_person_name,
            mobile_number,
            country_code,
            delivery_type,
            working_days,
            sub_category_id,
            email,
            password,
            address,
            ar_address,
            city,
            country,
            area,
            latitude,
            longitude,
            image,
            document,
            device_type,
            city_id,
            country_id,
            associated_manager,
            profile_id,
            website_url,
            twitter_link,
            facebook_link,
            instagram_link,
            eventtype_id,
            values,
          ];

          fieldsToCount = fieldsToCount.filter(
            (field) => field !== null && field !== undefined && field !== ""
          );
          const completionPercentage = (fieldsToCount.length / Object.keys(req.body).length) * 100;

          (restaurant.profile_completion = 100),
            (restaurant.name = name ? name : restaurant.name);
          restaurant.logo = logo ? logo : restaurant.logo;
          restaurant.ar_name = ar_name ? ar_name : restaurant.ar_name;
          restaurant.profile_id = profile_id
            ? profile_id
            : restaurant.profile_id;
          restaurant.description = description
            ? description
            : restaurant.description;
          restaurant.ar_description = ar_description
            ? ar_description
            : restaurant.ar_description;
          restaurant.contact_person_name = contact_person_name
            ? contact_person_name
            : restaurant.contact_person_name;
          restaurant.mobile_number = mobile_number
            ? mobile_number
            : restaurant.mobile_number;
          restaurant.country_code = country_code
            ? country_code
            : restaurant.country_code;
          restaurant.email = email ? email : restaurant.email;
          restaurant.have_whatsapp = have_whatsapp;
          restaurant.address = address ? address : restaurant.address;
          restaurant.ar_address = ar_address
            ? ar_address
            : restaurant.ar_address;
          restaurant.country_id = country_id
            ? country_id
            : restaurant.country_id;
          restaurant.city_id = city_id ? city_id : restaurant.city_id;
          restaurant.category_id = category_id
            ? category_id
            : restaurant.category_id;
          restaurant.sub_category_id = sub_category_id
            ? sub_category_id
            : restaurant.sub_category_id;
          restaurant.associated_manager = associated_manager
            ? associated_manager
            : restaurant.associated_manager;

          restaurant.latitude = latitude ? latitude : restaurant.latitude;
          restaurant.longitude = longitude ? longitude : restaurant.longitude;
          restaurant.image = image ? image : restaurant.image;
          restaurant.document = document ? document : restaurant.document;
          restaurant.map_address = map_address
            ? map_address
            : restaurant.map_address;
          restaurant.images_per_service = images_per_service
            ? images_per_service
            : restaurant.images_per_service;
          restaurant.number_of_service = number_of_service
            ? number_of_service
            : restaurant.number_of_service;
          restaurant.website_url = website_url
            ? website_url
            : restaurant.website_url;
          restaurant.twitter_link = twitter_link
            ? twitter_link
            : restaurant.twitter_link;
          restaurant.facebook_link = facebook_link
            ? facebook_link
            : restaurant.facebook_link;
          restaurant.instagram_link = instagram_link
            ? instagram_link
            : restaurant.instagram_link;
          restaurant.eventtype_id = eventtype_id
            ? eventtype_id
            : restaurant.eventtype_id;
          restaurant.values = values?.length
            ? values
            : restaurant.values;
          restaurant.packages = packages
            ? packages
            : restaurant.packages;
          restaurant.services = services
            ? services
            : restaurant.services;
          restaurant.progress = completionPercentage
            ? completionPercentage
            : restaurant.progress
          restaurant.location =
            longitude && latitude
              ? {
                type: "Point",
                coordinates: [longitude, latitude],
              }
              : restaurant.location;

          await restaurant.save();

          const user = await User.findById(restaurant.vendor_id);
          if (user) {
            user.name = name ? name : user.name;
            user.ar_name = ar_name ? ar_name : user.ar_name;
            user.email = email ? email?.toLowerCase() : user.email;
            user.mobile_number = mobile_number
              ? mobile_number
              : user.mobile_number;
            user.country_code = country_code ? country_code : user.country_code;
            user.image = logo ? logo : user.image;
            user.city = city ? city : user.city;
            user.country = country ? country : user.country;
            user.area = area ? area : user.area;
            user.mobile_number_sec = mobile_number_sec
              ? mobile_number_sec
              : user.mobile_number_sec;
            user.country_code_sec = country_code_sec
              ? country_code_sec
              : user.country_code_sec;
            user.have_whatsapp = have_whatsapp;
            user.have_whatsapp_sec = have_whatsapp_sec;
            (user.password = password
              ? await Auth.encryptPassword(password)
              : user.password),
              await user.save();
          }

          if (working_days) {
            console.log("working_days11", working_days);
            const existingRecords = await AvailabilityProvider.find({
              provider_id: restaurant._id,
            });
            await Promise.all(
              working_days.map(async (days) => {
                const { day, time } = days;
                if (day && time) {
                  const [open_time, close_time] = time;
                  console.log(open_time, close_time, day, "day11");
                  const existingRecord = existingRecords.find(
                    (record) => record.day === day
                  );
                  if (existingRecord) {
                    const updateData = await AvailabilityProvider.updateOne(
                      { _id: existingRecord._id },
                      { open_time, close_time }
                    );
                  } else {
                    const createData = await AvailabilityProvider.create({
                      provider_id: restaurant._id,
                      day,
                      open_time,
                      close_time,
                    });
                  }
                }
              })
            );
            const daysToDelete = existingRecords.filter(
              (record) => !working_days.some((day) => day.day === record.day)
            );
            await Promise.all(
              daysToDelete.map(async (record) => {
                const deleteResult = await AvailabilityProvider.deleteOne({
                  _id: record._id,
                });
              })
            );
          }

          if (password) {
            const emailTemplate = await EmailTemplate.findOne({
              slug: "welcome-and-update-password-planit",
            });
            const s_country = await ServiceCountry.findById(country_id);
            if (emailTemplate) {
              let replacedHTML = emailTemplate.description;
              replacedHTML = replacedHTML
                .replace("[NAME]", user.name || "")
                .replace("[PASSWORD]", password)
                .replace("[COUNTRY]", s_country?.name ?? "")
                .replace("[EMAIL]", user.email || "")
                .replace("[URL]", process.env.RESTAURANT_URL || "");

              let arHTML = emailTemplate.ar_description;
              arHTML = arHTML
                .replace("[NAME]", user.ar_name || "")
                .replace("[PASSWORD]", password)
                .replace("[COUNTRY]", s_country?.name ?? "")
                .replace("[EMAIL]", user.email || "")
                .replace("[URL]", process.env.RESTAURANT_URL || "");

              await MailHelper.sendMail(
                user.email,
                emailTemplate.subject,
                replacedHTML,
                arHTML
              );
            }
          }

          return _RS.apiNew(
            res,
            true,
            "Provider updated successfully",
            restaurant,
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.post(
      "/update-app-setting",
      Authentication.vendor,
      AuthController.updateAppSetting
    );

    this.router.post(
      "/send-otp",
      [
        body("mobile_number")
          .notEmpty()
          .withMessage("Valid mobile_number must be provided"),
        body("country_code")
          .notEmpty()
          .withMessage("Valid country_code must be provided"),
        body("email").notEmpty().withMessage("Valid email must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const {
            mobile_number,
            country_code,
            email,
          } = req.body;

          let user = await User.findOne({ email, type: UserTypes.VENDOR });

          if (!user) {
            return _RS.notFound(res, "NotFound", "Email doesn't exists!", {}, startTime);
          }

          user = await User.findOne({ mobile_number, country_code, type: UserTypes.VENDOR });

          if (!user) {
            return _RS.notFound(
              res,
              "NotFound",
              "Mobile number doesn't exists!",
              {},
              startTime
            );
          }

          const otp = (await Auth.generateOtp()).otp || 1234;
          user.otp = otp;
          await user.save();

          // Email
          const emailTemplate = await EmailTemplate.findOne({
            slug: "send-otp",
          });

          if (emailTemplate) {
            let replacedHTML = emailTemplate.description;
            replacedHTML = replacedHTML.replace("[OTP]", `${otp}`);

            let replacedArHTML = emailTemplate.ar_description;
            replacedArHTML = replacedArHTML.replace("[OTP]", `${otp}`);

            await MailHelper.sendMail(
              email,
              emailTemplate.subject,
              replacedHTML,
              replacedArHTML
            );
          }

          // SMS Sent
          // await Helper.sendTwilioWhatsApp({
          //   number: country_code + mobile_number,
          //   message: `Otp to verifying your mobile number is ${otp}`,
          // });
          // End SMS

          return _RS.ok(
            res,
            "OK",
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
        body("otp").notEmpty().withMessage("Valid email must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const { mobile_number, country_code, email, otp } = req.body;

          let user = await User.findOne({ mobile_number, country_code, type: UserTypes.VENDOR })

          if (!user) {
            return _RS.notFound(res, "false", "Mobile number doesn't exists!", {}, startTime);
          }

          user = await User.findOne({ email, type: UserTypes.VENDOR });

          if (!user) {
            return _RS.notFound(
              res,
              "false",
              "Email doesn't exists!",
              {},
              startTime
            );
          }

          if (otp == user.otp || otp == 1234) {
            user.otp = null;
            user.is_otp_verify = true;
            await user.save();

            return _RS.ok(
              res,
              "SUCCESS",
              "OTP has been verified successfully",
              {},
              startTime
            );
          }

          return _RS.badRequest(
            res,
            "Invalid",
            "Invalid OTP!",
            {},
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );

    this.router.post(
      "/sign-up",
      [
        body("name")
          .notEmpty()
          .withMessage("Valid name number must be provided"),
        body("category_id")
          .notEmpty()
          .withMessage("Valid category_id must be provided"),
        body("contact_person_name")
          .notEmpty()
          .withMessage("Valid contact_person_name must be provided"),
        body("mobile_number")
          .notEmpty()
          .withMessage("Valid mobile_number must be provided"),
        body("country_code")
          .notEmpty()
          .withMessage("Valid country_code must be provided"),
        body("email").notEmpty().withMessage("Valid email must be provided"),
        body("city_id").notEmpty().withMessage("Valid city must be provided"),
        body("country_id")
          .notEmpty()
          .withMessage("Valid country must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const {
            name,
            category_id,
            sub_category_id,
            contact_person_name,
            mobile_number,
            country_code,
            email: uEmail,
            address,
            city_id,
            country_id,
            latitude,
            longitude,
            device_token,
            device_type,
          } = req.body;

          const email = uEmail.toLowerCase();

          const restaurant = await Provider.findOne({ name });

          if (restaurant) {
            return _RS.conflict(
              res,
              "false",
              "Provider's Business name already used",
              {},
              startTime
            );
          }

          const profile_id = await ProviderProfile.findOne({ category_id })

          const existingUserByEmail = await User.findOne({
            email,
            type: UserTypes.VENDOR,
          });

          if (existingUserByEmail) {
            return _RS.conflict(res, "false", "Email already used", {}, startTime);
          }

          const existingUserByPhone = await User.findOne({
            mobile_number,
            country_code,
            type: UserTypes.VENDOR,
          });

          if (existingUserByPhone) {
            return _RS.conflict(
              res,
              "false",
              "Mobile number already used",
              {},
              startTime
            );
          }

          let password = await Auth.encryptPassword("Test@123");

          const data = await new Provider({
            name,
            category_id,
            sub_category_id,
            contact_person_name,
            mobile_number,
            country_code,
            email,
            location: {
              type: "Point",
              coordinates: [latitude, latitude],
            },
            address,
            city_id,
            country_id,
            password,
            latitude,
            longitude,
            device_token,
            device_type,
          }).save();

          const user = await new User({
            name: name,
            latitude,
            longitude,
            city_id,
            country_id,
            mobile_number,
            country_code,
            email,
            password,
            device_token,
            device_type,
            type: UserTypes.VENDOR,
            provider_id: data._id,
          }).save();

          data.vendor_id = user._id;
          await data.save();


          const payload = {
            id: user._id,
            email: user.email,
            type: user.type,
          };
          const token = await Auth.getToken(payload, "1d", next);

          const otp = (await Auth.generateOtp()).otp || 1234;
          user.otp = otp;
          await user.save();

          // Email
          const emailTemplate = await EmailTemplate.findOne({
            slug: "send-otp",
          });

          if (emailTemplate) {
            let replacedHTML = emailTemplate.description;
            replacedHTML = replacedHTML.replace("[OTP]", `${otp}`);

            let replacedArHTML = emailTemplate.ar_description;
            replacedArHTML = replacedArHTML.replace("[OTP]", `${otp}`);

            await MailHelper.sendMail(
              email,
              emailTemplate.subject,
              replacedHTML,
              replacedArHTML
            );
          }

          // SMS Sent
          // await Helper.sendTwilioWhatsApp({
          //   number: country_code + mobile_number,
          //   message: `Otp to verifying your mobile number is ${otp}`,
          // });
          // End SMS

          return _RS.ok(
            res,
            "OK",
            "Registration Done! An OTP has been sent successfully to your email!",
            { user: user, token, profile: profile_id?.permission },
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );

    this.router.post(
      "/forgot-password",
      Authentication.guest,
      [body("email").notEmpty().withMessage("Valid email must be provided")],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { email } = req.body;

          const user = await User.findOne({
            email: email.toLowerCase(),
            is_delete: false,
            type: UserTypes.VENDOR,
          });

          if (!user) {
            return _RS.api(
              res,
              false,
              "User not exist with this email address",
              {},
              startTime
            );
          } else {
            const otp = 1234;

            user.otp = otp;
            user.save();

            await Otp.create({
              mobile_number: user.mobile_number,
              type: user.type,
              country_code: user.country_code,
              email,
              otp,
              use_for: OtpUseFor.FORGET,
            });

            const emailTemplate = await EmailTemplate.findOne({
              slug: "send-otp",
            });

            if (emailTemplate) {
              let replacedHTML = emailTemplate.description;
              replacedHTML = replacedHTML.replace("[OTP]", `${otp}`);

              let replacedArHtml = emailTemplate.ar_description;
              replacedArHtml = replacedArHtml.replace("[OTP]", `${otp}`);

              await MailHelper.sendMail(
                user.email,
                emailTemplate.subject,
                replacedHTML,
                replacedArHtml
              );
            }

            return _RS.api(
              res,
              true,
              "OTP has been sent to your email",
              {},
              startTime
            );
          }
        } catch (error) {
          next(error);
        }
      }
    );

    this.router.post(
      "/reset-password",
      Authentication.guest,
      [
        body("email").notEmpty().withMessage("Valid email must be provided"),
        body("password")
          .notEmpty()
          .withMessage("Valid password must be provided"),
        body("type")
          .optional()
          .notEmpty()
          .withMessage("Valid email must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const { mobile_number, country_code, email, password } =
            req.body;

          let user = await User.findOne({ email: email.toLowerCase() });

          if (!user) {
            return _RS.apiNew(
              res,
              false,
              "User doesn't exist with this email",
              {},
              startTime
            );
          }

          let OTP = await Otp.findOne({ email });

          if (!OTP) {
            return _RS.apiNew(res, false, "Otp not verified", {}, startTime);
          }

          if (!OTP.is_used) {
            return _RS.apiNew(res, false, "Otp not verified", {}, startTime);
          }

          const newPassword = await Auth.encryptPassword(password);
          user.password = newPassword;
          user.otp = null;
          user.save();

          await Otp.findByIdAndDelete(OTP._id);

          return _RS.ok(
            res,
            "SUCCESS",
            "Password has been changed successfully",
            {},
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );
  }

  public get() {
    this.router.get(
      "/get-profile",
      Authentication.vendor,
      [],
      async (req, res, next) => {
        const startTime = new Date().getTime();
        try {
          let vendor = await User.findOne({
            _id: req.user.id,
          }).populate([{ path: "provider_id" }, { path: "country_id" }]);

          if (!vendor) {
            return _RS.notFound(
              res,
              "NOTFOUND",
              "User not exist, go to signup page",
              vendor,
              startTime
            );
          }
          return _RS.ok(
            res,
            "SUCCESS",
            "Get Profile Successfully",
            {user:vendor},
            startTime
          );
        } catch (err) {
          next(err);
        }
      }
    );
  }

}

export default new AuthRouter().router;
