import { Router } from "express";
import { body, param, query } from "express-validator";

import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import _RS from "../../helpers/ResponseHelper";
import Notification, { Audience, NotificationStatus } from "../../models/Notification";
import Restaurant from "../../models/Provider";
import User, { ApproveStatus, UserTypes } from "../../models/User";

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
  }

  public get() {
    this.router.get("/",
      Authentication.vendor,
      [
        query('page').notEmpty().withMessage('Valid page number must be provided'),
        query('pageSize').notEmpty().withMessage('Valid page number must be provided'),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {

          const startTime = new Date().getTime();

          let sort: any = { created_at: -1 };

          let page = 1;
          let pageSize = 1000000;

          const filter: any = { "users.user_id": req.user.id }

          if (req.query.page) page = parseInt(req.query.page);
          // if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

          const skipDocuments = (page - 1) * pageSize;
          let total = await Notification.countDocuments(filter)

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
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
                notifications: { $push: "$$ROOT" } // You can also use $push to get the entire document
              }
            }
          ]

          const data = await Notification.aggregate(pipeline)

          return _RS.apiNew(
            res,
            true,
            "Notification list  get successfully",
            {
              data,
              total,
              page,
              pageSize
            },
            startTime
          );

        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    ); 

    this.router.get("/top-five",
    Authentication.vendor,
    [
        query('page').optional().notEmpty().withMessage('Valid page number must be provided'),
        query('pageSize').optional().notEmpty().withMessage('Valid page number must be provided'),
    ],
    ValidateRequest,
    Authentication.userLanguage,
    async (req, res, next) => {
        try {

            const startTime = new Date().getTime();

            let sort: any = { created_at: -1 };

            let page = 1;
            let pageSize = 3;

            const filter: any = { "users.user_id": req.user.id }

            if (req.query.page) page = parseInt(req.query.page);
            if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);


            const skipDocuments = (page - 1) * pageSize;
            let total = await Notification.countDocuments(filter)

            const pipeline: any = [
                { $match: filter },
                { $sort: sort },
                {
                    $skip: skipDocuments,
                },
                {
                    $limit: pageSize,
                },
            ]

            const data = await Notification.aggregate(pipeline)

            return _RS.apiNew(
                res,
                true,
                "Notification list  get successfully",
                {
                    data,
                    total,
                    page,
                    pageSize
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