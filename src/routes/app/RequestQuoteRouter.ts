import * as mongoose from "mongoose";
import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import RequestQuote from "../../models/RequestQuote";
import _RS from "../../helpers/ResponseHelper";
import { body, param, query } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import Provider from "../../models/Provider";
import Serivces from "../../models/Serivces";
import User from "../../models/User";
import Helper from "../../helpers/Helper";


class AttributeRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.get();
    this.post()
  }

  public post() {
    this.router.post("/", Authentication.user,
      [
        body('service_id').notEmpty().withMessage('Valid service must be provided'),
        body('attributes').optional().notEmpty().withMessage('Valid attribute must be provided'),
        body('comment').optional().notEmpty().withMessage('Valid comment must be provided'),
      ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { service_id, attributes, comment, vendor_id, image, price } = req.body;

          let flag = await Serivces.findById(service_id);
          if (!flag) {
            return _RS.api(res, false, "Service not found!", {}, startTime);
          }

          flag = await User.findById(vendor_id);
          if (!flag) {
            return _RS.api(res, false, "Provider not found!", {}, startTime);
          }

          const create = await RequestQuote.create({
            user_id: req.user.id, attributes, service_id, comment, image, vendor_id, price
          });

          await Helper.sendNotificationUser({ to_id: req.user.id, from_id: Helper.adminId, title: "", description: "" })

          return _RS.apiNew(
            res,
            true,
            "Request Quote has been sent successfully",
            create,
            startTime
          );
        } catch (err) {
          next(err);
        }
      });
  }

  public get() {
    this.router.get("/provider/:id",
      Authentication.user,
      [
        param('id').notEmpty().isMongoId().withMessage('Valid provider id must be provided'),
      ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();



          const getData = await Provider.findOne({ _id: req.params.id }).populate({
            path: "services",
            populate: ([
              { path: "attribute_id" },
              { path: "service_id" }

            ])
          });


          if (!getData) {
            return _RS.apiNew(
              res,
              false,
              "Provider  not found",
              getData,
              startTime,
            );
          }

          return _RS.ok(
            res,
            "SUCCESS",
            "Provider fetch successfully",
            getData,
            startTime,
          );
        } catch (err) {
          next(err);
        }
      });




    this.router.get("/", Authentication.user,
      [],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          let sort = [["created_at", -1]];
          if (req.query.sort) {
            sort = Object.keys(req.query.sort).map((key) => [
              key,
              req.query.sort[key],
            ]);
          }

          const options = {
            page: req.query.page || 1,
            limit: req.query.pageSize || 100,
            collation: {
              locale: "en",
            },
          };

          let filter: any = {
            is_delete: false,
            user_id: new mongoose.Types.ObjectId(req.user.id),
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



          if (req.query.status) {
            var arrayValues = req.query.status.split(",");
            var booleanValues = arrayValues.map(function (value) {
              return value.toLowerCase() === "true";
            });
            filter.is_active = { $in: booleanValues };
          }


          let query = [
            {
              $match: filter,
            },
            {
              $lookup: {
                from: "Users",
                localField: "user_id",
                foreignField: "_id",
                as: "user_id",
              },
            },
            {
              $unwind: {
                path: "$user_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "services",
                localField: "service_id",
                foreignField: "_id",
                as: "service_id",
              },
            },
            {
              $unwind: {
                path: "$service_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "Provider",
                localField: "vendor_id",
                foreignField: "_id",
                as: "vendor_id",
              },
            },
            {
              $unwind: {
                path: "$vendor_id",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $sort: {
                created_at: -1,
              },
            },

          ];

          var myAggregate = RequestQuote.aggregate(query);

          let list = await RequestQuote.aggregatePaginate(myAggregate, options);
          const data = list.docs.map(doc => doc)
          return _RS.ok(res, "SUCCESS", "Request Quote List retrived successfully", data, startTime);
        } catch (err) {
          next(err);
        }
      });





  }
}

export default new AttributeRouter().router;
