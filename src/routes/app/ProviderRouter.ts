import * as mongoose from "mongoose";
import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import Provider from "../../models/Provider";
import _RS from "../../helpers/ResponseHelper";
import { body, param, query } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { pipeline } from "stream";
import Favourite from "../../models/Favourite";

class ProviderRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.get();
    this.post();
  }

  public post() {}

  public get() {
    this.router.get(
      "/:id",
      // Authentication.user,
      [
        param("id")
          .notEmpty()
          .isMongoId()
          .withMessage("Valid provider id must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          let filter = {
            _id: new mongoose.Types.ObjectId(req.params.id),
          };

          // const pipeline: any = [
          //   { $match: filter },
          //   {
          //     $lookup: {
          //       from: "categories",
          //       localField: "category_id",
          //       foreignField: "_id",
          //       as: "category_id",
          //     },
          //   },
          //   {
          //     $unwind: {
          //       path: "$category_id",
          //       preserveNullAndEmptyArrays: true,
          //     },
          //   },
          //   {
          //     $lookup: {
          //       from: "subcategories",
          //       localField: "sub_category_id",
          //       foreignField: "_id",
          //       as: "sub_category_id",
          //     },
          //   },
          //   {
          //     $lookup: {
          //       from: "profile",
          //       localField: "profile_id",
          //       foreignField: "_id",
          //       as: "profile_id",
          //     },
          //   },
          //   {
          //     $unwind: {
          //       path: "$profile_id",
          //       preserveNullAndEmptyArrays: true,
          //     },
          //   },
          //   {
          //     $lookup: {
          //       from: "eventtype",
          //       localField: "eventtype_id",
          //       foreignField: "_id",
          //       as: "eventtype_id",
          //     },
          //   },
          //   {
          //     $unwind: {
          //       path: "$eventtype_id",
          //       preserveNullAndEmptyArrays: true,
          //     },
          //   },
          //   // {
          //   //   $lookup: {
          //   //     from: "services",
          //   //     localField: "services",
          //   //     foreignField: "_id",
          //   //     as: "services",
          //   //     pipeline: [
          //   //       {
          //   //         $lookup: {
          //   //           from: "services",
          //   //           localField: "service_id",
          //   //           foreignField: "_id",
          //   //           as: "service_id",
          //   //         }
          //   //       },
          //   //       {
          //   //         $unwind: {
          //   //           path: "$service_id",
          //   //           preserveNullAndEmptyArrays: true,
          //   //         }
          //   //       },
          //   //       {
          //   //         $lookup: {
          //   //           from: "attributes",
          //   //           localField: "attribute_id",
          //   //           foreignField: "_id",
          //   //           as: "attribute_id",
          //   //         }
          //   //       },
          //   //     ]
          //   //   }
          //   // },
          //   {
          //     $lookup: {
          //       from: "attributes",
          //       localField: "services.attribute_id",
          //       foreignField: "_id",
          //       as: "services.attribute_id"
          //     }
          //   },
          //   {
          //     $lookup: {
          //       from: "services",
          //       localField: "services.service_id",
          //       foreignField: "_id",
          //       as: "services.service_id"
          //     }
          //   },
          //   {
          //     $lookup: {
          //       from: "servicecountries",
          //       localField: "country_id",
          //       foreignField: "_id",
          //       as: "country_id",
          //     },
          //   },
          //   {
          //     $unwind: {
          //       path: "$country_id",
          //       preserveNullAndEmptyArrays: true,
          //     },
          //   },
          //   {
          //     $lookup: {
          //       from: "servicecities",
          //       localField: "city_id",
          //       foreignField: "_id",
          //       as: "city_id",
          //     },
          //   },
          //   {
          //     $unwind: {
          //       path: "$city_id",
          //       preserveNullAndEmptyArrays: true,
          //     },
          //   },
          //   {
          //     $lookup: {
          //       from: "users",
          //       localField: "associated_manager",
          //       foreignField: "_id",
          //       as: "associated_manager",
          //     },
          //   },
          //   {
          //     $unwind: {
          //       path: "$associated_manager",
          //       preserveNullAndEmptyArrays: true,
          //     },
          //   },
          //   {
          //     $lookup: {
          //       from: "availabilityproviders",
          //       localField: "_id",
          //       foreignField: "provider_id",
          //       as: "working_days",
          //     },
          //   },
          // ];

          // const data = await Provider.aggregate(pipeline);

          const data = await Provider.findOne({ _id: req.params.id })
            .populate([
              { path: "profile_id" },
              { path: "eventtype_id" },
              { path: "associated_manager" },
              { path: "category_id" },
              { path: "sub_category_id" },
            ])
            .populate({
              path: "services",
              populate: [{ path: "attribute_id" }, { path: "service_id" }],
            })
            .lean();

          if(!data){
            return _RS.apiNew(
              res,
              false,
              "Provider not found",
              {},
              startTime,
            );
          }

          // const is_fav = await Favourite.findOne({user_id: req.user.id})

          return _RS.apiNew(
            res,
            true,
            "Provider fetch successfully",
            { data: data },
            startTime
          );
        } catch (err) {
          next(err);
        }
      }
    );
  }
}

export default new ProviderRouter().router;
