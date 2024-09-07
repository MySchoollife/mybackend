import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import _RS from "../../helpers/ResponseHelper";
import * as mongoose from "mongoose";
import Helper from "../../helpers/Helper";
import Profile from "../../models/ProviderProfile";
import MailHelper from "../../helpers/MailHelper";
import EmailTemplate from "../../models/EmailTemplate";
import Auth from "../../Utils/Auth";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import ServiceCity from "../../models/ServiceCity";
import { env } from "../../environments/Env";
import Provider from "../../models/Provider";
import { ChangeLogAction } from "../../models/ChangeLog";
import { changeLog } from "../../helpers/function";
import { UserTypes } from "../../models/User";

const xlsx = require("xlsx");
const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: env().awsAccessKey,
  secretAccessKey: env().awsSecretKey,
  region: "us-east-1" || env().region,
});
// AWS.config.update({
//     accessKeyId: '',
//     secretAccessKey: '',
//     region: 'us-east-1'
// });o

// AWS.config.update({
//     accessKeyId: process.env.aws_access_key,
//     secretAccessKey: process.env.aws_secret_key,
//     region: process.env.region
// });

const s3 = new AWS.S3();

const collationOptions = {
  locale: "en",
  strength: 2,
};

class ProfileRouter {
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
      checkPermission(Permissions.PROVIDERPROFILE),
      [
        body("name").notEmpty().withMessage("Valid name must be provided"),
        body("category_id")
          .notEmpty()
          .withMessage("Valid category must be provided"),
        body("permission")
          .notEmpty()
          .isArray()
          .withMessage("Valid permission Array  must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const { name, category_id, country_id, permission } = req.body;

          let isExists = await Profile.findOne({ name, category_id });

          if (isExists?.is_delete) {
            await Profile.deleteOne({ category_id });
          }

          if (isExists && !isExists?.is_delete) {
            return _RS.apiNew(
              res,
              false,
              "Profile Name already used",
              {},
              startTime
            );
          }

          const selectedKeys = permission
            ?.filter((item) => item.is_selected)
            ?.map((item) => item.name);

          const headerRow = selectedKeys.reduce((obj, key, index) => {
            obj[String.fromCharCode(65 + index)] = key;
            return obj;
          }, {});

          console.log(Object.values(headerRow), "lll");
          const workbook = xlsx.utils.book_new();

          const worksheet = xlsx.utils.json_to_sheet(
            [Object.values(headerRow)],
            {
              skipHeader: true, // we don't want to see object properties as our headers
            }
          );

          xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
          const buffer = xlsx.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
          });

          const params = {
            Bucket: env().s3Bucket,
            Key: `${name}.profiles.xlsx`,
            Body: buffer,
            ContentType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          };

          const uploadResult = await s3.upload(params).promise();

          const user = await Profile.create({
            name,
            country_id,
            category_id,
            permission,
            xlurl: uploadResult.Location,
          });

          if (req.user.type == UserTypes.SUB_ADMIN) {
            await changeLog(
              ChangeLogAction.ADD,
              `Added New SP Profile ${user?.name}.`,
              req.user.id
            );
          }

          return _RS.apiNew(
            res,
            true,
            "Profile added successfully",
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
      checkPermission(Permissions.PROVIDERPROFILE),
      [
        body("name").notEmpty().withMessage("Valid name must be provided"),
        body("category_id")
          .notEmpty()
          .withMessage("Valid category must be provided"),
        body("permission")
          .notEmpty()
          .isArray()
          .withMessage("Valid permission Array  must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const user = await Profile.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "profile not found", {}, startTime);
          }

          const { name, category_id, country_id, permission } = req.body;

          let isExists = await Profile.findOne({
            name,
            category_id,
            _id: { $ne: req.params.id },
          });

          if (isExists?.is_delete) {
            await Profile.deleteOne({ category_id });
          }

          if (isExists && !isExists?.is_delete) {
            return _RS.apiNew(
              res,
              false,
              "Category already used",
              {},
              startTime
            );
          }

          const selectedKeys = permission
            ?.filter((item) => item.is_selected)
            ?.map((item) => item.name);

          const headerRow = selectedKeys.reduce((obj, key, index) => {
            obj[String.fromCharCode(65 + index)] = key;
            return obj;
          }, {});

          console.log(Object.values(headerRow), "lll");
          const workbook = xlsx.utils.book_new();

          const worksheet = xlsx.utils.json_to_sheet(
            [Object.values(headerRow)],
            {
              skipHeader: true, // we don't want to see object properties as our headers
            }
          );

          xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
          const buffer = xlsx.write(workbook, {
            type: "buffer",
            bookType: "xlsx",
          });

          const params = {
            Bucket: "sugamaya" || env().s3Bucket,
            Key: `${user.name}.profiles.xlsx`,
            Body: buffer,
            ContentType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          };

          const uploadResult = await s3.upload(params).promise();

          user.name = name ? name : user.name;
          user.category_id = category_id ? category_id : user.category_id;
          user.country_id = country_id ? country_id : user.country_id;
          user.permission = permission ? permission : user.permission;
          user.xlurl = uploadResult.Location;
          await user.save();

          if (req.user.type == UserTypes.SUB_ADMIN) {
            await changeLog(
              ChangeLogAction.UPDATE,
              `Updated SP Profile ${user?.name}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Profile updated successfully",
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
      "/status/:id",
      Authentication.admin,
      checkPermission(Permissions.PROVIDERPROFILE),
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

          const user = await Profile.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "Profile not found", {}, startTime);
          }
          user.is_active = !user.is_active;

          await user.save();

          if (req.user.type == UserTypes.SUB_ADMIN) {
            await changeLog(
              ChangeLogAction.STATUS,
              `Changed Status SP Profile ${user?.name}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Profile status changed successfully",
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
      checkPermission(Permissions.PROVIDERPROFILE),
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

          const user = await Profile.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "Profile not found", {}, startTime);
          }

          user.is_delete = true;

          await user.save();
          if (req.user.type == UserTypes.SUB_ADMIN) {
            await changeLog(
              ChangeLogAction.DELETE,
              `Deleted  SP Profile ${user?.name}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Profile deleted successfully",
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
      checkPermission(Permissions.PROVIDERPROFILE),
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

          const filter: any = { is_delete: false, ...req.filter }; //is_collector: false

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
          if (req.query.status) {
            var arrayValues = req.query.status.split(",");
            var booleanValues = arrayValues.map(function (value) {
              return value.toLowerCase() === "true";
            });
            filter.is_active = { $in: booleanValues };
          }

          let year = new Date().getFullYear();
          const skipDocuments = (page - 1) * pageSize;
          let total = await Profile.countDocuments(filter);

          const pipeline: any = [
            { $match: filter },

            {
              $lookup: {
                from: "categories",
                localField: "category_id",
                foreignField: "_id",
                as: "category_id",
              },
            },
            {
              $unwind: {
                path: "$category_id",
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

          const data = await Profile.aggregate(pipeline).collation(
            collationOptions
          );
          const sdata = await Promise.all(
            data.map(async (item) => {
              const haveItem = await Provider.findOne({
                profile_id: item._id,
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
              const haveActiveItem = await Provider.findOne({
                profile_id: item._id,
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
            "Profile list  get successfully",
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
      checkPermission(Permissions.PROVIDERPROFILE),
      [],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = { is_delete: false, ...req.filter };

          if (req.country_id) filter.country_id = req.country_id;

          const data = await Profile.find({ ...filter }).select(
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

export default new ProfileRouter().router;
