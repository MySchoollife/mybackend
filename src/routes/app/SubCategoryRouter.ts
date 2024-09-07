import * as mongoose from "mongoose";
import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import SubCategory from "../../models/SubCategory";
import _RS from "../../helpers/ResponseHelper";
import { body, param, query } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";


class SubCategoryRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.get();
  }



  public get() {
    this.router.get("/:id", 
    // Authentication.user,
     [
      param('id').notEmpty().isMongoId().withMessage('Valid category id  must be provided'),
      // query('page').optional().notEmpty().withMessage('Valid page number must be provided'),
      // query('pageSize').optional().notEmpty().withMessage('Valid page number must be provided'),
    ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          let sort: any = [["createdAt", -1]];
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
            category_id: new mongoose.Types.ObjectId(req.params.id)
            // country_id: new mongoose.Types.ObjectId(req.country_id)
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


          let query: any = [
            {
              $match: filter,
            },
            {
              $lookup: {
                from: "categories",
                localField: "category_id",
                foreignField: "_id",
                as: "category_id"
              }
            },

            {
              $unwind: {
                path: "$category_id",
                preserveNullAndEmptyArrays: true
              },
            },
            {
              $sort: {
                created_at: -1,
              },
            },
          ];

          var myAggregate = SubCategory.aggregate(query);
          let list = await SubCategory.aggregatePaginate(myAggregate, options);
          return _RS.apiNew(
            res, true,  "SubCategory List retrived successfully", list, startTime
          )
        } catch (err) {
          next(err);
        }
      });

  }
}

export default new SubCategoryRouter().router;
