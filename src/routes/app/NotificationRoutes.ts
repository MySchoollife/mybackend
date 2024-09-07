import { Router } from "express";

import Authentication from "../../Middlewares/Authnetication";
import NotificationUser from "../../models/NotificationUser";
import _RS from "../../helpers/ResponseHelper";
import mongoose from "mongoose";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { param } from "express-validator";

class NotificationRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
    this.delete();

  }

  public post() {
    this.router.post(
      "/read/:id?",
      Authentication.user,
      [
        param('id').notEmpty().isMongoId().withMessage('Valid notification id must be provided'),
      ],
      ValidateRequest,
      async (req, res, next) => {
        const startTime = new Date().getTime();
         const id = req.params.id 
        try {
          const notifications = await NotificationUser.findById(id)
          if (!notifications) {
            return _RS.apiNew(res, false, "Notifications not found", {}, startTime);
        }

        notifications.is_read = true
        await notifications.save()

        return _RS.apiNew(
            res,
            true,
            "Notifications read Successfully",
            {},
            startTime
        );
        } catch (error) {
          next(error);
        }
      }
    );
  }

  public get() {
    this.router.get("/", Authentication.user, [], async (req, res, next) => {
      const startTime = new Date().getTime();
      try {
        let filter: any = {
          to_id: req.user.id
        };
        const pipeline: any = [
          {
            $match: {
              ...filter,
            },
          },
        ];

        const data = await NotificationUser.aggregate(pipeline);

        return _RS.api(
          res,
          true,
          "Notifications get Successfully",
          data,
          startTime
        );
      } catch (error) {
        next(error);
      }
    });

    this.router.get(
      "/show/:id?",
      Authentication.user,
      [
        param('id').notEmpty().isMongoId().withMessage('Valid notification id must be provided'),
      ],
      ValidateRequest,
      async (req, res, next) => {
        const startTime = new Date().getTime();
         const id = req.params.id 
        try {
          const notifications = await NotificationUser.findById(id)
          if (!notifications) {
            return _RS.apiNew(res, false, "Notifications not found", {}, startTime);
        }


        return _RS.apiNew(
            res,
            true,
            "Notifications show Successfully",
            {},
            startTime
        );
        } catch (error) {
          next(error);
        }
      }
    );

    this.router.get("/top-five",
    Authentication.user,
    [],
    ValidateRequest,
    async (req, res, next) => {
        try {
           console.log(req.user.id,"req.user.id.....")
            const startTime = new Date().getTime();
            let filter : any = {
              to_id : req.user.id
            };
            
            const pipeline: any = [
                { $match: filter },
                { $sort: {created_at : -1} },             
            ]
            const data = await NotificationUser.aggregate(pipeline)

            return _RS.apiNew(
                res,
                true,
                "top five Notification list  get successfully",     
                    {data : data},
                startTime
            );

        } catch (error) {
            console.log("Error :", error);

            next(error);
        }
    }
);
    
   
  }

  public delete() {

    this.router.delete(
      "/delete/:id?",
      Authentication.user,
      [
        param('id').notEmpty().isMongoId().withMessage('Valid notification id must be provided'),
      ],
      ValidateRequest,
      async (req, res, next) => {
        const startTime = new Date().getTime();
         const id = req.params.id 
        try {
          const notifications = await NotificationUser.findById(id)

          if (!notifications) {
            return _RS.apiNew(res, false, "Notifications not found", {}, startTime);
        }

        notifications.is_delete = true
        await notifications.save()

        return _RS.apiNew(
            res,
            true,
            "Notifications delete Successfully",
            {},
            startTime
        );
        } catch (error) {
          next(error);
        }
      }
    );
  }
}

export default new NotificationRoutes().router;
