import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import _RS from "../../helpers/ResponseHelper";
import * as mongoose from "mongoose";
import Helper from "../../helpers/Helper";
import User, { UserTypes } from "../../models/User";
import MailHelper from "../../helpers/MailHelper";
import EmailTemplate from "../../models/EmailTemplate";
import Auth from "../../Utils/Auth";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";

import { activityLog } from "../../helpers/function";
import { Action } from "../../models/ActivityLog";

const collationOptions = {
  locale: "en",
  strength: 2,
};

class TeacherRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
  }

  public post() {
    this.router.post(
      "/",
      Authentication.admin,
      checkPermission(Permissions.TEACHER),
      [
        body("name").notEmpty().withMessage("Valid name must be provided"),
        body("email").notEmpty().withMessage("Valid email must be provided"),
        body("mobile_number")
          .notEmpty()
          .withMessage("Valid mobile_number must be provided"),
        body("country_code")
          .notEmpty()
          .withMessage("Valid country_code must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const {
            name,
            mobile_number,
            country_code,
            role_title,
            email,
            is_collector,
            permission,
          } = req.body;
          const userType = UserTypes.TEACHER;

          let isSubAdminExists = await User.findOne({
            email: new RegExp(`^${email}$`, "i"),
            type: userType,
          });

          if (isSubAdminExists?.is_delete) {
            await User.deleteOne({ email, type: userType });
          }

          if (isSubAdminExists && !isSubAdminExists?.is_delete) {
            return _RS.apiNew(res, false, "Email already used", {}, startTime);
          }

          isSubAdminExists = await User.findOne({
            mobile_number,
            country_code,
            type: userType,
          });

          if (isSubAdminExists?.is_delete) {
            await User.deleteOne({
              mobile_number,
              country_code,
              type: userType,
            });
          }

          if (isSubAdminExists && !isSubAdminExists?.is_delete) {
            return _RS.apiNew(
              res,
              false,
              "Mobile number  already used",
              {},
              startTime
            );
          }

          const password = await Auth.encryptPassword("Test@123");

          const user = await User.create({
            mobile_number,
            country_code,
            name,
            role_title,
            email,
            is_collector,
            type: userType,
            password,
            permission,
          });

          const emailTemplate = await EmailTemplate.findOne({
            slug: "welcome-and-password-subadmin",
          });
          console.log("emailTemplate", emailTemplate);
          if (emailTemplate) {
            let replacedHTML = emailTemplate.description;
            replacedHTML = replacedHTML
              .replace("[NAME]", user.name || "")
              .replace("[PASSWORD]", "Test@123")
              .replace("[EMAIL]", user.email || "")
              .replace("[TITLE]", user.role_title || "")
              .replace(
                "[URL]",
                process.env.ADMIN_URL || "http://153.92.4.13:7901/login"
              );

            let arHTML = emailTemplate.ar_description;
            arHTML = arHTML
              .replace("[NAME]", user.name || "")
              .replace("[PASSWORD]", "Test@123")
              .replace("[EMAIL]", user.email || "")
              .replace("[TITLE]", user.role_title || "")
              .replace(
                "[URL]",
                process.env.ADMIN_URL || "http://153.92.4.13:7901/login"
              );

            await MailHelper.sendMail(
              user.email,
              emailTemplate.subject,
              replacedHTML,
              arHTML
            );
          }

          return _RS.apiNew(
            res,
            true,
            "Teacher added successfully",
            { data: user },
            startTime
          );
        } catch (error) {
          console.log("Error:", error);
          next(error);
        }
      }
    );

    this.router.put(
      "/:id",
      Authentication.admin,
      checkPermission(Permissions.TEACHER),
      [
        param("id")
          .notEmpty()
          .isMongoId()
          .withMessage("Valid id must be provided"),
        body("name").notEmpty().withMessage("Valid name must be provided"),
        body("email").notEmpty().withMessage("Valid email must be provided"),
        body("mobile_number")
          .notEmpty()
          .withMessage("Valid mobile_number must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const user = await User.findById(id).populate({
            path: "title",
            selected: "name _id",
          });

          if (!user) {
            return _RS.apiNew(res, false, "Sub Admin not found", {}, startTime);
          }

          const {
            name,
            mobile_number,
            country_code,
            country_id,
            role_title,
            city_id,
            city,
            email,
            is_collector,
            password,
            permission,
          } = req.body;

          const userType = UserTypes.TEACHER;

          let isSubAdminExists = await User.findOne({
            email: new RegExp(`^${email}$`, "i"),
            type: userType,
            _id: { $ne: id },
          });

          if (isSubAdminExists?.is_delete) {
            await User.deleteOne({ email, type: userType });
          }

          if (isSubAdminExists && !isSubAdminExists?.is_delete) {
            return _RS.apiNew(res, false, "Email already used", {}, startTime);
          }

          isSubAdminExists = await User.findOne({
            mobile_number,
            country_code,
            type: userType,
            _id: { $ne: id },
          });

          if (isSubAdminExists?.is_delete) {
            await User.deleteOne({
              mobile_number,
              country_code,
              type: userType,
            });
          }

          if (isSubAdminExists && !isSubAdminExists?.is_delete) {
            return _RS.apiNew(
              res,
              false,
              "Mobile number  already used",
              {},
              startTime
            );
          }

          console.log("user11", user);
          user.name = name ? name : user.name;
          user.role_title = role_title ? role_title : user.role_title;
          user.city = city ? city : user.city;
          user.mobile_number = mobile_number
            ? mobile_number
            : user.mobile_number;
          user.country_code = country_code ? country_code : user.country_code;

          user.permission = permission ? permission : user.permission;

          user.email = email ? email : user.email;
          user.is_collector = is_collector;
          (user.password = password
            ? await Auth.encryptPassword(password)
            : user.password),
            await user.save();

          if (password) {
            const emailTemplate = await EmailTemplate.findOne({
              slug: "welcome-and-update-password-subadmin",
            });
            console.log("emailTemplate", emailTemplate);
            if (emailTemplate) {
              let replacedHTML = emailTemplate.description;
              replacedHTML = replacedHTML
                .replace("[NAME]", user.name || "")
                .replace("[PASSWORD]", password)
                .replace("[EMAIL]", user.email || "")
                // .replace("[TITLE]", role?.name || "")
                .replace("[URL]", process.env.ADMIN_URL || "");

              let arHTML = emailTemplate.ar_description;
              arHTML = arHTML
                .replace("[NAME]", user.name || "")
                .replace("[PASSWORD]", password)
                .replace("[EMAIL]", user.email || "")
                // .replace("[TITLE]", role?.name || "")
                .replace("[URL]", process.env.ADMIN_URL || "");

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
            "Sub Admin updated successfully",
            user,
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.put(
      "/:id/status",
      Authentication.admin,
      checkPermission(Permissions.TEACHER),
      [
        param("id")
          .notEmpty()
          .isMongoId()
          .withMessage("Valid id must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const user = await User.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "Sub Admin not found", {}, startTime);
          }

          const { message } = req.body;
          if (user.is_active) activityLog(Action.BLOCK, message, user._id);
          else activityLog(Action.UNBLOCK, message, user._id);

          user.is_active = !user.is_active;

          await user.save();

          return _RS.apiNew(
            res,
            true,
            "Sub Admin status changed successfully",
            user,
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.delete(
      "/:id",
      Authentication.admin,
      checkPermission(Permissions.TEACHER),
      [
        param("id")
          .notEmpty()
          .isMongoId()
          .withMessage("Valid id must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const user = await User.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "Sub Admin not found", {}, startTime);
          }

          user.is_delete = true;

          await user.save();

          return _RS.apiNew(
            res,
            true,
            "Sub Admin deleted successfully",
            user,
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );
  }

  public get() {
    this.router.get(
      "/",
      Authentication.admin,
      checkPermission(Permissions.TEACHER),
      [
        query("page")
          .notEmpty()
          .withMessage("Valid page number must be provided"),
        query("pageSize")
          .notEmpty()
          .withMessage("Valid page number must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          let sort: any = { created_at: -1 };

          let page = 1;
          let pageSize = 100;

          const filter: any = {
            type: UserTypes.TEACHER,
          };

          if (req.query.search && req.query.search.trim()) {
            filter.$or = [
              {
                name: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
              {
                email: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
              {
                country_code: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
              {
                mobile_number: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
            ];
          }
          if (req.query.type === "all") filter.is_delete = false;
          if (req.query.type === "deleted") filter.is_delete = true;
          if (req.query.name)
            sort = { name: req.query.name == "ascend" ? 1 : -1 };
          if (req.query.page) page = parseInt(req.query.page);
          if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);
          if (req.query.role_id)
            filter.role_id = new mongoose.Types.ObjectId(req.query.role_id);

          let year = new Date().getFullYear();

          if (req.query.year) {
            year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }

          if (req.query.month) {
            const month = parseInt(req.query.month);
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 1);
            filter.created_at = {
              $gte: startOfMonth,
              $lt: endOfMonth,
            };
          }

          if (req.query.status) {
            var arrayValues = req.query.status.split(",");
            var booleanValues = arrayValues.map(function (value) {
              return value.toLowerCase() === "true";
            });
            filter.is_active = { $in: booleanValues };
          }

          const skipDocuments = (page - 1) * pageSize;
          let total = await User.countDocuments(filter);

          const pipeline: any = [
            { $match: filter },
            {
              $lookup: {
                from: "servicecountries",
                localField: "country_id",
                foreignField: "_id",
                as: "country_id",
              },
            },
            {
              $unwind: {
                path: "$country_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "cities",
                localField: "city_ids",
                foreignField: "_id",
                as: "city_id",
              },
            },
            {
              $lookup: {
                from: "roles",
                localField: "role_id",
                foreignField: "_id",
                as: "role_id",
              },
            },
            {
              $unwind: {
                path: "$role_id",
                preserveNullAndEmptyArrays: true,
              },
            },

            { $sort: sort },
            {
              $skip: skipDocuments,
            },
            {
              $limit: pageSize,
            },
          ];

          const data = await User.aggregate(pipeline).collation(
            collationOptions
          );

          return _RS.apiNew(
            res,
            true,
            "Teacher list  get successfully",
            {
              data: data,
              total,
              page,
              pageSize,
            },
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.get(
      "/view/:id",
      Authentication.admin,
      checkPermission(Permissions.TEACHER),
      [
        param("id")
          .notEmpty()
          .isMongoId()
          .withMessage("Valid id must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const user = await User.findById(id).lean();

          if (!user) {
            return _RS.apiNew(res, false, "Teacher not found", {}, startTime);
          }

          return _RS.apiNew(
            res,
            true,
            "Teacher Get successfully",
            { data: user },
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.get(
      "/filters",
      Authentication.admin,
      checkPermission(Permissions.TEACHER),
      [],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = {
            is_delete: false,
            type: UserTypes.TEACHER,
            ...req.filter,
          };

          const data = await User.find({ ...filter }).select(
            "city_id country_id role_id city_ids created_at permission"
          );

          const ids = data.map((id) => id.role_id);

          return _RS.apiNew(
            res,
            true,
            "Filter list  get successfully",
            {},
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );
  }
}

export default new TeacherRouter().router;
