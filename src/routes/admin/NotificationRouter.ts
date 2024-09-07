import { Router } from "express";
import { body, param, query } from "express-validator";

import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import _RS from "../../helpers/ResponseHelper";
import Notification, {
  Audience,
  NotificationStatus,
} from "../../models/Notification";
import UserNotification from "../../models/NotificationUser";

import User, { UserTypes } from "../../models/User";
import { changeLog } from "../../helpers/function";
import { ChangeLogAction } from "../../models/ChangeLog";

const collationOptions = {
  locale: "en",
  strength: 2,
};

class NotificationRouter {
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
      [
        body("message")
          .notEmpty()
          .withMessage("Valid message must be provided"),
        body("ar_message")
          .notEmpty()
          .withMessage("Valid ar_message must be provided"),
        body("title").notEmpty().withMessage("Valid  title must be provided"),
        body("ar_title")
          .notEmpty()
          .withMessage("Valid ar_title  must be provided"),
        // body('start_date').notEmpty().withMessage('Valid start_date must be provided'),
        body("audience")
          .notEmpty()
          .withMessage("Valid audience must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const {
            message,
            ar_title,
            category_id,
            country_id,
            city_id,
            ar_message,
            audience,
            age_range,
            loyalty_point,
            gender,
            profession,
            Schedule_time,
            title,
            start_date,
          } = req.body;
          let users;
          let userIds = [];
          if (audience == Audience.VENDOR) {
            const providers = await User.find({
              is_active: true,
              is_delete: false,
              is_verify: true,
              type: UserTypes.TEACHER,
            });
            const userIds = providers.map(({ _id }) => _id);
            users = userIds.map((user_id) => ({
              user_id,
              title,
              ar_title,
              message,
              ar_message,
              is_read: false,
            }));
          } else if (audience == Audience.CUSTOMERS) {
            const customers = await User.find({
              is_active: true,
              is_delete: false,
              is_verify: true,
              type: UserTypes.TEACHER,
            });
            const userIds = customers.map(({ _id }) => _id);
            users = userIds.map((user_id) => ({
              user_id,
              title,
              ar_title,
              message,
              ar_message,
              is_read: false,
            }));
          }

          const fcmTokens = (await User.find({ _id: { $in: userIds } }))
            .filter((item: any) => item?.fcm_token)
            .map((item) => item.fcm_token);
          console.log(fcmTokens);
          if (fcmTokens.length) {
            // await NotificationNewController.sendMulticastNotification(fcmTokens, title, message);
          }

          const notificationData = await Notification.create({
            audience: audience,
            title: title,
            ar_title,
            message,
            ar_message,
            users,
            country_id,
            city_id,
            status: NotificationStatus.SENT,
            send_by: "admin",
            Schedule_time,
          });

          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.ADD,
              `Send Notification ${notificationData?.title}.`,
              req.user.id
            );
          }

          return _RS.apiNew(
            res,
            true,
            "Notification has been saved successfully.",
            { data: notificationData },
            startTime
          );
        } catch (error) {
          console.log("Error:", error);
          next(error);
        }
      }
    );

    this.router.put(
      "/:id/status",
      Authentication.admin,
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

          user.is_active = !user.is_active;

          await user.save();

          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.STATUS,
              `Changed Status Notification ${user?.title}.`,
              req.user.id
            );
          }

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

          const notification = await Notification.findById(id);

          if (!notification) {
            return _RS.apiNew(
              res,
              false,
              "Notification not found",
              {},
              startTime
            );
          }

          notification.is_delete = true;

          await notification.save();
          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.DELETE,
              `Deleted Notification ${notification?.title}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Notification deleted successfully",
            notification,
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
          let pageSize = 20000;

          const filter: any = { "users.user_id": req.user.id };

          if (req.query.page) page = parseInt(req.query.page);
          // if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

          const skipDocuments = (page - 1) * pageSize;
          let total = await Notification.countDocuments(filter);

          const pipeline: any = [
            { $match: filter },
            {
              $skip: skipDocuments,
            },
            {
              $limit: pageSize,
            },
            { $sort: sort },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$created_at" },
                },
                notifications: { $push: "$$ROOT" }, // You can also use $push to get the entire document
              },
            },
            { $sort: { _id: -1 } },
          ];

          const data = await Notification.aggregate(pipeline);

          return _RS.apiNew(
            res,
            true,
            "Notification list  get successfully",
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
      "/user-notification",
      Authentication.admin,
      [
        query("page")
          .optional()
          .notEmpty()
          .withMessage("Valid page number must be provided"),
        query("pageSize")
          .optional()
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
          let pageSize = 20000;

          const filter: any = {};

          if (req.query.page) page = parseInt(req.query.page);
          const skipDocuments = (page - 1) * pageSize;
          let total = await UserNotification.countDocuments(filter);

          const pipeline: any = [
            { $match: filter },
            {
              $skip: skipDocuments,
            },
            {
              $limit: pageSize,
            },
            { $sort: sort },
            {
              $lookup: {
                from: "users",
                localField: "from_id",
                foreignField: "_id",
                as: "from_id",
              },
            },
            {
              $unwind: {
                path: "$from_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$created_at" },
                },
                notifications: { $push: "$$ROOT" }, // You can also use $push to get the entire document
              },
            },
            { $sort: { _id: -1 } },
          ];

          const data = await UserNotification.aggregate(pipeline);

          return _RS.apiNew(
            res,
            true,
            "User Notification list  get successfully",
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
      "/push",
      Authentication.admin,
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
          let pageSize = 20000;

          const filter: any = { send_by: "admin", is_delete: false };

          if (req.query.page) page = parseInt(req.query.page);
          // if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

          const skipDocuments = (page - 1) * pageSize;
          let total = await Notification.countDocuments(filter);

          const pipeline: any = [
            { $match: filter },
            {
              $skip: skipDocuments,
            },
            {
              $limit: pageSize,
            },
            { $sort: sort },
            // {
            //     $group: {
            //         _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            //         notifications: { $push: "$$ROOT" } // You can also use $push to get the entire document
            //     }
            // },
            // { $sort: { _id: -1 } },
          ];

          const data = await Notification.aggregate(pipeline);

          return _RS.apiNew(
            res,
            true,
            "Notification list  get successfully",
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
      "/top-five",
      Authentication.admin,
      [
        query("page")
          .optional()
          .notEmpty()
          .withMessage("Valid page number must be provided"),
        query("pageSize")
          .optional()
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
          let pageSize = 3;

          const filter: any = {};

          if (req.query.page) page = parseInt(req.query.page);
          if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

          const skipDocuments = (page - 1) * pageSize;
          let total = await UserNotification.countDocuments(filter);

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

          const data = await UserNotification.aggregate(pipeline);

          return _RS.apiNew(
            res,
            true,
            "top five Notification list  get successfully",
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
  }
}

export default new NotificationRouter().router;
