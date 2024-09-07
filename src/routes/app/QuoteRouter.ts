import * as mongoose from "mongoose";
import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import QuoteTemplate from "../../models/QuoteTemplate";
import _RS from "../../helpers/ResponseHelper";
import { body, param, query } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";


class QuoteTemplateRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.get();
  }

  public get() {

    this.router.get("/view/:id",
      Authentication.user,
      [
        param('id').isMongoId().notEmpty().withMessage('Valid Quote id must be provided'),
      ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const getData = await QuoteTemplate.findOne({ _id: req.params.id });

          if (!getData) {
            return _RS.notFound(
              res,
              "NOTFOUND",
              "Quote  not found",
              getData,
              startTime,
            );
          }

          return _RS.ok(
            res,
            "SUCCESS",
            "Quote template fetch successfully",
            getData,
            startTime,
          );
        } catch (err) {
          next(err);
        }
      });

    this.router.get("/:category_id/:service_id", Authentication.user,
      [
        param('category_id').notEmpty().isMongoId().withMessage('Valid Category Id must be provided'),
        param('service_id').notEmpty().isMongoId().withMessage('Valid Service Id must be provided'),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          let sort = [["createdAt", -1]];
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
            category_id: new mongoose.Types.ObjectId(req.params.category_id),
            service_id: new mongoose.Types.ObjectId(req.params.service_id),
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
                from: "attributes",
                localField: "attribute_id",
                foreignField: "_id",
                as: "attribute_id",
              },
            },
            {
              $sort: {
                created_at: -1,
              },
            },

          ];

          var myAggregate = QuoteTemplate.aggregate(query);

          let list = await QuoteTemplate.aggregatePaginate(myAggregate, options);

          return _RS.ok(res, "SUCCESS", "Quote List retrived successfully", list, startTime);
        } catch (err) {
          next(err);
        }
      });

  }
}

export default new QuoteTemplateRouter().router;
