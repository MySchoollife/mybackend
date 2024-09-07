import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import _RS from "../../helpers/ResponseHelper";
import * as mongoose from "mongoose";
import Helper from "../../helpers/Helper";
import Lead from "../../models/Lead";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import ServiceCity from "../../models/ServiceCity";
import { activityLog, changeLog } from "../../helpers/function";
import { Action } from "../../models/ActivityLog";
import User, { UserTypes } from "../../models/User";
import { ChangeLogAction } from "../../models/ChangeLog";
import { getAllJSDocTags } from "typescript";

const collationOptions = {
  locale: "en",
  strength: 2,
};

class LeadRouter {
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
      checkPermission(Permissions.Role),
      [body("name").notEmpty().withMessage("Valid name must be provided")],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          let {
            admission_class_id,
            source_id,
            referred_id,
            name,
            email,
            dob,
            gender,
            mobile_number,
            country_code,
            nationality,
            religion,
            category,
            aadhar_number,
            school_address,
            attended_class_id,
            school_pincode,
            city_id,
            country_id,
            address,
            lead_status_id,
            remark,
            guardian_name,
            relation,
            guardian_email,
            guardian_occupation,
            guardian_mobile_number,
            guardian_country_code,
          } = req.body;

          const user = await Lead.create({
            admission_class_id,
            source_id,
            referred_id,
            name,
            email,
            dob,
            gender,
            mobile_number,
            country_code,
            nationality,
            religion,
            category,
            aadhar_number,
            school_address,
            attended_class_id,
            school_pincode,
            city_id,
            country_id,
            address,
            lead_status_id,
            remark,
            guardian_name,
            relation,
            guardian_email,
            guardian_occupation,
            guardian_mobile_number,
            guardian_country_code,
          });

          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.ADD,
              `Added New Lead ${user?.name}.`,
              req.user.id
            );
          }

          return _RS.apiNew(
            res,
            true,
            "Lead added successfully",
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
      checkPermission(Permissions.Role),
      [body("name").notEmpty().withMessage("Valid name must be provided")],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const getData = await Lead.findById(id);

          if (!getData) {
            return _RS.apiNew(res, false, "lead not found", {}, startTime);
          }

          let {
            admission_class_id,
            source_id,
            referred_id,
            name,
            email,
            dob,
            gender,
            mobile_number,
            country_code,
            nationality,
            religion,
            category,
            aadhar_number,
            school_address,
            attended_class_id,
            school_pincode,
            city_id,
            country_id,
            address,
            lead_status_id,
            remark,
            guardian_name,
            relation,
            guardian_email,
            guardian_occupation,
            guardian_mobile_number,
            guardian_country_code,
          } = req.body;

          getData.admission_class_id = admission_class_id
            ? admission_class_id
            : getData.admission_class_id;
          getData.source_id = source_id ? source_id : getData.source_id;
          getData.referred_id = referred_id ? referred_id : getData.referred_id;
          getData.dob = dob ? dob : getData.dob;
          getData.mobile_number = mobile_number
            ? mobile_number
            : getData.mobile_number;
          getData.gender = gender ? gender : getData.gender;
          getData.country_code = country_code
            ? country_code
            : getData.country_code;
          getData.nationality = nationality ? nationality : getData.nationality;
          getData.religion = religion ? religion : getData.religion;
          getData.category = category ? category : getData.category;
          getData.aadhar_number = aadhar_number
            ? aadhar_number
            : getData.aadhar_number;
          getData.school_address = school_address
            ? school_address
            : getData.school_address;
          getData.attended_class_id = attended_class_id
            ? attended_class_id
            : getData.attended_class_id;
          getData.school_pincode = school_pincode
            ? school_pincode
            : getData.school_pincode;
          getData.city_id = city_id ? city_id : getData.city_id;
          getData.country_id = country_id ? country_id : getData.country_id;
          getData.address = address ? address : getData.address;
          getData.lead_status_id = lead_status_id
            ? lead_status_id
            : getData.lead_status_id;
          getData.remark = remark ? remark : getData.remark;
          getData.guardian_name = guardian_name
            ? guardian_name
            : getData.guardian_name;
          getData.relation = relation ? relation : getData.relation;
          getData.guardian_email = guardian_email
            ? guardian_email
            : getData.guardian_email;
          getData.guardian_occupation = guardian_occupation
            ? guardian_occupation
            : getData.guardian_occupation;
          getData.guardian_mobile_number = guardian_mobile_number
            ? guardian_mobile_number
            : getData.guardian_mobile_number;
          getData.guardian_country_code = guardian_country_code
            ? guardian_country_code
            : getData.guardian_country_code;
          getData.name = name ? name : getData.name;
          getData.email = email ? email : getData.email;

          await getData.save();
          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.UPDATE,
              `Updated Lead ${getData?.name}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "lead updated successfully",
            getData,
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
      checkPermission(Permissions.Role),
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

          const user = await Lead.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "Role not found", {}, startTime);
          }

          const { message } = req.body;
          if (user.is_active) activityLog(Action.BLOCK, message, user._id);
          else activityLog(Action.UNBLOCK, message, user._id);

          user.is_active = !user.is_active;

          await user.save();
          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.STATUS,
              `Changed Status SubAdmin Role ${user?.name}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Role status changed successfully",
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
      checkPermission(Permissions.Role),
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

          const user = await Lead.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "Role not found", {}, startTime);
          }

          user.is_delete = true;

          await user.save();
          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.DELETE,
              `Deleted SubAdmin Role ${user?.name}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Role deleted successfully",
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
      checkPermission(Permissions.Role),
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
            is_delete: false,
            ...req.filter,
          };

          if (req.query.search && req.query.search.trim()) {
            filter.$or = [
              {
                name: {
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

          const skipDocuments = (page - 1) * pageSize;
          let total = await Lead.countDocuments(filter);

          const pipeline: any = [
            { $match: filter },
            {
              $lookup: {
                from: "classes",
                localField: "admission_class_id",
                foreignField: "_id",
                as: "admission_class_id",
              },
            },
            {
              $unwind: {
                path: "$admission_class_id",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "classes",
                localField: "attended_class_id",
                foreignField: "_id",
                as: "attended_class_id",
              },
            },
            {
              $unwind: {
                path: "$attended_class_id",
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

          let data = await Lead.aggregate(pipeline).collation(collationOptions);

          const sdata = await Promise.all(
            data.map(async (item) => {
              const haveItem = await User.findOne({
                type: UserTypes.TEACHER,
                role_id: item._id,
                country_id: req.country_id,
                is_delete: false,
              });
              return {
                ...item,
                have_item: haveItem ? true : false,
              };
            })
          );
          const adata = await Promise.all(
            sdata.map(async (item) => {
              const haveActiveItem = await User.findOne({
                type: UserTypes.TEACHER,
                role_id: item._id,
                country_id: req.country_id,
                is_delete: false,
                is_active: true,
              });
              return {
                ...item,
                have_active_item: haveActiveItem ? true : false,
              };
            })
          );

          return _RS.apiNew(
            res,
            true,
            "lead list  get successfully",
            {
              data: adata,
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
      checkPermission(Permissions.Role),
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

          if (req.country_id) filter.country_id = req.country_id;

          const data = await Lead.find({ ...filter }).select(
            "city_id country_id  city_ids created_at permission"
          );

          const cityIds = [
            ...new Set(
              data.reduce((acc, { city_ids }) => {
                acc.push(...city_ids);
                return acc;
              }, [])
            ),
          ];

          // const permission = [...new Set(data.map(({ permission }: any) => permission))]
          const permission = [
            ...new Set(
              data.reduce((acc, { permission }) => {
                acc.push(...permission);
                return acc;
              }, [])
            ),
          ];

          const [year, city] = await Promise.all([
            Helper.getYearAndMonth(data),
            ServiceCity.find({ _id: { $in: cityIds } }),
          ]);

          return _RS.apiNew(
            res,
            true,
            "Filter list  get successfully",
            {
              data: city,
              ...year,
              permission,
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

export default new LeadRouter().router;
