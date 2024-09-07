import { Router } from "express";
import * as mongoose from "mongoose";

import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import _RS from "../../helpers/ResponseHelper";
import Helper from "../../helpers/Helper";
import Student, { UserTypes } from "../../models/Student";
import MailHelper from "../../helpers/MailHelper";
import EmailTemplate from "../../models/EmailTemplate";
import Auth from "../../Utils/Auth";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import { activityLog, changeLog } from "../../helpers/function";
import { Action } from "../../models/ActivityLog";
import { ChangeLogAction } from "../../models/ChangeLog";

const collationOptions = {
  locale: "en",
  strength: 2,
};

class StudentRouter {
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
      checkPermission(Permissions.STUDENT),
      [
        body("name").notEmpty().withMessage("Valid name must be provided"),
        body("classname").notEmpty().withMessage("Valid name must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const {
            name,
            email,
            mobile_number,
            country_code,
            dob,
            gender,
            classname,
            c_address,
            p_address,
            addmission_number,
            join_date,
            roll_number,
            father_name,
            mother_name,
            occupation,
            parent_email,
            parent_mobile_number,
            Parent_country_code,
            parent_other_mobile_number,
            Parent_other_country_code,
          } = req.body;

          let isStudentExists = await Student.findOne({
            email: new RegExp(`^${email}$`, "i"),
            type: UserTypes.STUDENT,
          });

          if (isStudentExists?.is_delete) {
            await Student.deleteOne({ email, type: UserTypes.STUDENT });
          }

          if (isStudentExists && !isStudentExists?.is_delete) {
            return _RS.apiNew(res, false, "Email already used", {}, startTime);
          }

          isStudentExists = await Student.findOne({
            mobile_number,
            country_code,
            type: UserTypes.STUDENT,
          });

          if (isStudentExists?.is_delete) {
            await Student.deleteOne({
              mobile_number,
              country_code,
              type: UserTypes.STUDENT,
            });
          }

          if (isStudentExists && !isStudentExists?.is_delete) {
            return _RS.apiNew(
              res,
              false,
              "mobile number already used",
              {},
              startTime
            );
          }

          const user = await Student.create({
            name,
            dob,
            gender,
            mobile_number,
            country_code,
            email,
            type: UserTypes.STUDENT,
            classname,
            c_address,
            p_address,
            addmission_number,
            join_date,
            roll_number,
            father_name,
            mother_name,
            occupation,
            parent_email,
            parent_mobile_number,
            Parent_country_code,
            parent_other_mobile_number,
            Parent_other_country_code,
            password: await Auth.encryptPassword("Test@123"),
          });

          const emailTemplate = await EmailTemplate.findOne({
            slug: "welcome-and-password-customer",
          });

          if (emailTemplate) {
            let replacedHTML = emailTemplate.description;
            replacedHTML = replacedHTML
              .replace("[NAME]", user?.name || "")
              .replace("[PASSWORD]", "Test@123")
              .replace("[EMAIL]", user?.email || "")
              .replace("[URL]", "" || "")
              .replace(
                "[MOBILE NUMBER]",
                user?.country_code + " " + user?.mobile_number || ""
              );

            let arHTML = emailTemplate.ar_description;
            arHTML = arHTML
              .replace("[NAME]", user?.name || "")
              .replace("[PASSWORD]", "Test@123")
              .replace("[EMAIL]", user?.email || "")
              .replace("[URL]", "" || "")
              .replace(
                "[MOBILE NUMBER]",
                user?.country_code + " " + user?.mobile_number || ""
              );

            await MailHelper.sendMail(
              user?.email,
              emailTemplate.subject,
              replacedHTML,
              arHTML
            );
          }

          // SMS Sent

          // End SMS
          return _RS.apiNew(
            res,
            true,
            "Student Details added successfully",
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
      checkPermission(Permissions.STUDENT),
      [
        body("name").notEmpty().withMessage("Valid name must be provided"),
        body("classname").notEmpty().withMessage("Valid name must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const user = await Student.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "Student not found", {}, startTime);
          }

          const {
            name,
            email,
            mobile_number,
            country_code,
            dob,
            gender,
            classname,
            c_address,
            p_address,
            addmission_number,
            join_date,
            roll_number,
            father_name,
            mother_name,
            occupation,
            parent_email,
            parent_mobile_number,
            Parent_country_code,
            parent_other_mobile_number,
            Parent_other_country_code,
            image,
          } = req.body;

          let isAlready = await Student.findOne({
            email: new RegExp(`^${email}$`, "i"),
            _id: { $ne: id },
            type: UserTypes.STUDENT,
          });

          if (isAlready?.is_delete) {
            await Student.deleteOne({ email, type: UserTypes.STUDENT });
          }

          if (isAlready && !isAlready?.is_delete) {
            return _RS.apiNew(res, false, "Email already used", {}, startTime);
          }

          isAlready = await Student.findOne({
            mobile_number,
            country_code,
            type: UserTypes.STUDENT,
            _id: { $ne: id },
          });

          if (isAlready?.is_delete) {
            await Student.deleteOne({
              mobile_number,
              country_code,
              type: UserTypes.STUDENT,
            });
          }

          if (isAlready && !isAlready?.is_delete) {
            return _RS.apiNew(
              res,
              false,
              "mobile number already used",
              {},
              startTime
            );
          }

          user.name = name ? name : user.name;
          user.classname = classname ? classname : user.classname;
          user.dob = dob ? dob : user.dob;
          user.image = image ? image : user.image;
          user.gender = gender ? gender : user.gender;
          user.mobile_number = mobile_number
            ? mobile_number
            : user.mobile_number;
          user.country_code = country_code ? country_code : user.country_code;
          user.email = email ? email : user.email;
          user.c_address = c_address ? c_address : user.c_address;
          user.p_address = p_address ? p_address : user.p_address;
          user.addmission_number = addmission_number
            ? addmission_number
            : user.addmission_number;
          user.join_date = join_date ? join_date : user.join_date;
          user.roll_number = roll_number ? roll_number : user.roll_number;
          user.father_name = father_name ? father_name : user.father_name;
          user.mother_name = mother_name ? mother_name : user.mother_name;
          user.occupation = occupation ? occupation : user.occupation;
          user.parent_email = parent_email ? parent_email : user.parent_email;
          user.parent_mobile_number = parent_mobile_number
            ? parent_mobile_number
            : user.parent_mobile_number;
          user.Parent_country_code = Parent_country_code
            ? Parent_country_code
            : user.Parent_country_code;
          user.parent_other_mobile_number = parent_other_mobile_number
            ? parent_other_mobile_number
            : user.parent_other_mobile_number;
          user.Parent_other_country_code = Parent_other_country_code
            ? Parent_other_country_code
            : user.Parent_other_country_code;

          await user.save();

          return _RS.apiNew(
            res,
            true,
            "Student updated successfully",
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
      checkPermission(Permissions.STUDENT),
      [
        param("id")
          .notEmpty()
          .isMongoId()
          .withMessage("Valid id must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const user = await Student.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "User not found", {}, startTime);
          }

          const { message } = req.body;
          if (user.is_active) activityLog(Action.BLOCK, message, user._id);
          else activityLog(Action.UNBLOCK, message, user._id);

          user.is_active = !user.is_active;

          await user.save();

          return _RS.apiNew(
            res,
            true,
            "User status changed successfully",
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
      checkPermission(Permissions.STUDENT),
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

          const user = await Student.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "User not found", {}, startTime);
          }

          user.is_delete = true;

          await user.save();

          return _RS.apiNew(
            res,
            true,
            "User deleted successfully",
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
      checkPermission(Permissions.STUDENT),
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
          console.log("req.filter", req.filter);
          const filter: any = {
            is_delete: false,
            type: UserTypes.STUDENT,
            //  ...req.filter
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
          if (req.query.name)
            sort = { name: req.query.name == "ascend" ? 1 : -1 };
          if (req.query.page) page = parseInt(req.query.page);
          if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

          let year = new Date().getFullYear();
          // if (req.country_id) filter.country_id = new mongoose.Types.ObjectId(req.country_id);
          if (req.query.city_id)
            filter.city_id = new mongoose.Types.ObjectId(req.query.city_id);
          if (req.query.status)
            filter.is_active =
              req.query.status === "true"
                ? true
                : req.query.status === "false"
                ? false
                : undefined;

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

          if (
            req.query.start_date &&
            req.query.start_date !== "" &&
            req.query.end_date &&
            req.query.end_date !== ""
          ) {
            filter.created_at = {
              $gte: new Date(req.query.start_date + "T00:00:00Z"),
              $lte: new Date(req.query.end_date + "T23:59:59Z"),
            };
          } else {
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }

          const skipDocuments = (page - 1) * pageSize;
          let total = await Student.countDocuments(filter);
          console.log(filter, "user filter", total);

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
                localField: "city_id",
                foreignField: "_id",
                as: "city_id",
              },
            },
            {
              $unwind: {
                path: "$city_id",
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

          const data = await Student.aggregate(pipeline).collation(
            collationOptions
          );

          return _RS.apiNew(
            res,
            true,
            "User list  get successfully",
            {
              data,
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
      "/filters",
      Authentication.admin,
      checkPermission(Permissions.STUDENT),
      [],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = {
            is_delete: false,
            type: UserTypes.STUDENT,
            ...req.filter,
          };

          if (req.country_id) filter.country_id = req.country_id;

          const data = await Student.find({ ...filter }).select(
            "city_id country_id created_at"
          );

          const cityIds = [...new Set(data.map(({ city_id }: any) => city_id))];

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

    this.router.get(
      "/view/:id",
      Authentication.admin,
      checkPermission(Permissions.STUDENT),
      [param("id").notEmpty().withMessage("Valid Student id must be required")],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const id = req.params.id;

          const filter: any = {
            is_delete: false,
            type: UserTypes.STUDENT,
            _id: new mongoose.Types.ObjectId(id),
          };

          const data = await Student.findOne({ ...filter });

          if (!data)
            return _RS.apiNew(res, true, "Student Not Found", {}, startTime);

          return _RS.apiNew(
            res,
            true,
            "Student   get successfully",
            {
              data: data,
            },
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

export default new StudentRouter().router;
