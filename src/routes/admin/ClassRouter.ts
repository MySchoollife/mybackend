import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import _RS from "../../helpers/ResponseHelper";
import * as mongoose from "mongoose";
import Class from "../../models/Class";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import { activityLog, changeLog } from "../../helpers/function";
import { Action } from "../../models/ActivityLog";
import User, { UserTypes } from "../../models/User";
import { ChangeLogAction } from "../../models/ChangeLog";

const collationOptions = {
  locale: "en",
  strength: 2,
};

class ClassRouter {
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

          let { name, section_id, order_number, description } = req.body;
          name = name ? name.trim() : name;
          const nameRegex = new RegExp(`^${name}$`, "i");
          let isExists = await Class.findOne({
            name: { $regex: nameRegex },
            is_delete: false,
          });

          if (isExists?.is_delete) {
            await Class.deleteOne({
              name: { $regex: nameRegex },
            });
          }

          if (isExists && !isExists?.is_delete) {
            return _RS.apiNew(
              res,
              false,
              "Class name already used",
              {},
              startTime
            );
          }
          const user = await Class.create({
            name,
            section_id,
            order_number,
            description,
          });

          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.ADD,
              `Added New Class ${user?.name}.`,
              req.user.id
            );
          }

          return _RS.apiNew(
            res,
            true,
            "Class added successfully",
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

          const user = await Class.findById(id);

          if (!user) {
            return _RS.apiNew(
              res,
              false,
              "Lead Status not found",
              {},
              startTime
            );
          }

          let { name, section_id, order_number, description } = req.body;
          name = name ? name.trim() : name;
          const nameRegex = new RegExp(`^${name}$`, "i");

          let isAlready = await Class.findOne({
            name: { $regex: nameRegex },
            _id: { $ne: id },
            is_delete: false,
          });
          if (isAlready?.is_delete) {
            await Class.deleteOne({
              name: { $regex: nameRegex },
              _id: { $ne: id },
            });
          }

          if (isAlready && !isAlready?.is_delete) {
            return _RS.apiNew(res, false, "Class already used", {}, startTime);
          }

          user.name = name ? name : user.name;
          user.section_id = section_id ? section_id : user.section_id;
          user.order_number = order_number ? order_number : user.order_number;
          user.description = description ? description : user.description;

          await user.save();
          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.UPDATE,
              `Updated Class ${user?.name}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Class updated successfully",
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

          const user = await Class.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "Class not found", {}, startTime);
          }

          const { message } = req.body;
          if (user.is_active) activityLog(Action.BLOCK, message, user._id);
          else activityLog(Action.UNBLOCK, message, user._id);

          user.is_active = !user.is_active;

          await user.save();
          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.STATUS,
              `Changed Status  Class ${user?.name}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Class status changed successfully",
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

          const user = await Class.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "Class not found", {}, startTime);
          }

          user.is_delete = true;

          await user.save();
          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.DELETE,
              `Deleted Class ${user?.name}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Class deleted successfully",
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

          if (req.query.role) {
            filter.permission = {
              $in: [req.query.role],
            };
          }
          const skipDocuments = (page - 1) * pageSize;
          let total = await Class.countDocuments(filter);

          const pipeline: any = [
            { $match: filter },

            { $sort: sort },
            {
              $skip: skipDocuments,
            },
            {
              $limit: pageSize,
            },
          ];

          let data = await Class.aggregate(pipeline).collation(
            collationOptions
          );

          const sdata = await Promise.all(
            data.map(async (item) => {
              const haveItem = await User.findOne({
                role_id: item._id,
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
                role_id: item._id,
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
            "Class list  get successfully",
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
  }
}

export default new ClassRouter().router;
