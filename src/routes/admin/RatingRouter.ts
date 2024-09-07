import { Router } from "express";
import { query, param } from "express-validator";
import * as mongoose from "mongoose";
import Authentication from "../../Middlewares/Authnetication";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import Helper from "../../helpers/Helper";
import _RS from "../../helpers/ResponseHelper";
import RatingsAndReview, { Rating } from "../../models/RatingsAndReview";
import ServiceCity from "../../models/ServiceCity";
import User, { ApproveStatus, UserTypes } from "../../models/User";
import Restaurant from "../../models/Provider";

const collationOptions = {
  locale: "en",
  strength: 2,
};

class RatingRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.get();
    this.post();
  }

  public post() {
    this.router.put(
      "/:id",
      Authentication.admin,
      checkPermission(Permissions.RATING_AND_REVIEWS),
      [param("id").notEmpty().withMessage("Valid id must be provided")],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const filter: any = {};
          const id = req.params.id;

          if (req.country_id)
            filter.country_id = new mongoose.Types.ObjectId(req.country_id);

          const rating = await RatingsAndReview.findOne({ _id: id });

          if (!rating) {
            return _RS.apiNew(
              res,
              false,
              "Review Not found",
              { data: rating },
              startTime
            );
          }

          rating.is_active = !rating.is_active;
          await rating.save();

          return _RS.apiNew(
            res,
            true,
            "Rating Status changed  successfully",
            { data: rating },
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
      checkPermission(Permissions.RATING_AND_REVIEWS),
      [
        param("id").notEmpty().withMessage("Valid id must be provided"),
        // query('pageSize').notEmpty().withMessage('Valid page number must be provided'),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const filter: any = {};
          const id = req.params.id;

          if (req.country_id)
            filter.country_id = new mongoose.Types.ObjectId(req.country_id);

          const rating = await RatingsAndReview.findOne({ _id: id });

          if (!rating) {
            return _RS.apiNew(
              res,
              false,
              "Review Not found",
              { data: rating },
              startTime
            );
          }

          rating.is_delete = true;
          await rating.save();

          return _RS.apiNew(
            res,
            true,
            "Review Deleted  successfully",
            { data: rating },
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
    // restaurant data
    this.router.get(
      "/restaurant",
      Authentication.admin,
      checkPermission(Permissions.RATING_AND_REVIEWS),
      [],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          let year = new Date().getFullYear();
          const filter: any = { ...req.filter };

          if (req.country_id)
            filter.country_id = new mongoose.Types.ObjectId(req.country_id);
          if (req.query.city_id)
            filter.city_id = new mongoose.Types.ObjectId(req.query.city_id);
          if (req.query.year) {
            year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }
          let rate = req.query.rate;
          if (rate) {
            switch (rate) {
              case "2":
                filter.rating = { $gte: 3, $lt: 2 };
                break;
              case "3":
                filter.rating = { $gte: 4, $lt: 3 };
                break;
              case "4":
                filter.rating = { $gte: 4 };
                break;
              default:
                break;
            }
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

          const [top, bottom] = await Promise.all([
            RatingsAndReview.aggregate([
              {
                $match: {
                  reviewee_id: { $ne: null },
                  rating_for: "Restaurant",
                  ...filter,
                },
              },
              {
                $group: {
                  _id: "$reviewee_id",
                  averageRating: { $avg: "$rating" }, // Calculate average rating for each restaurant
                  ratingsCount: {
                    $push: {
                      rating: "$rating",
                      count: 1,
                    },
                  },
                },
              },
              {
                $addFields: {
                  averageRating: "$averageRating",
                },
              },
              {
                $addFields: {
                  total: { $size: "$ratingsCount" },
                },
              },
              {
                $unwind: "$ratingsCount", // Unwind the ratingsCount array
              },
              {
                $group: {
                  _id: {
                    restaurantId: "$_id",
                    rating: "$ratingsCount.rating", // Group by restaurantId and rating
                  },
                  averageRating: { $first: "$averageRating" },
                  total: { $first: "$total" },
                  count: { $sum: "$ratingsCount.count" }, // Sum up the counts for each rating
                },
              },
              {
                $group: {
                  _id: "$_id.restaurantId",
                  averageRating: { $first: "$averageRating" },
                  total: { $first: "$total" }, // Preserve the averageRating
                  ratingsCount: {
                    $push: {
                      rating: "$_id.rating",
                      count: "$count",
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  averageRating: 1,
                  ratingsCount: 1,
                  total: 1,
                },
              },
              {
                $lookup: {
                  from: "restaurants",
                  localField: "_id",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $unwind: "$user",
              },
              {
                $sort: { averageRating: -1 }, // Sort by average rating in descending order
              },
              {
                $limit: 5, // Limit to top 5 restaurants
              },
            ]),
            RatingsAndReview.aggregate([
              {
                $match: {
                  reviewee_id: { $ne: null },
                  rating_for: "Restaurant",
                  ...filter,
                },
              },
              {
                $group: {
                  _id: "$reviewee_id",
                  averageRating: { $avg: "$rating" }, // Calculate average rating for each user
                  ratingsCount: {
                    $push: {
                      rating: "$rating",
                      count: 1,
                    },
                  },
                },
              },
              {
                $addFields: {
                  averageRating: "$averageRating",
                },
              },
              {
                $addFields: {
                  total: { $size: "$ratingsCount" },
                },
              },
              {
                $unwind: "$ratingsCount", // Unwind the ratingsCount array
              },
              {
                $group: {
                  _id: {
                    restaurantId: "$_id",
                    rating: "$ratingsCount.rating", // Group by restaurantId and rating
                  },
                  averageRating: { $first: "$averageRating" },
                  total: { $first: "$total" },
                  count: { $sum: "$ratingsCount.count" }, // Sum up the counts for each rating
                },
              },
              {
                $group: {
                  _id: "$_id.restaurantId",
                  averageRating: { $first: "$averageRating" }, // Preserve the averageRating
                  total: { $first: "$total" },
                  ratingsCount: {
                    $push: {
                      rating: "$_id.rating",
                      count: "$count",
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  averageRating: 1,
                  ratingsCount: 1,
                  total: 1,
                },
              },
              {
                $lookup: {
                  from: "restaurants",
                  localField: "_id",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $unwind: "$user",
              },
              {
                $sort: { averageRating: 1 }, // Sort by average rating in descending order
              },
              {
                $limit: 5, // Limit to top 5 restaurants
              },
            ]),
          ]);
          // await Promise.all(top.map(async(result, index) => {
          //   await Restaurant.updateOne({_id:result._id},{$set:{rating:result.averageRating,review_count:result.total}})
          //   console.log(`#${index + 1} Restaurant ID: ${result._id}, Average Rating: ${result.averageRating}`);
          //   console.log("Rating Counts:");
          //   result.ratingsCount.forEach(({ rating, count }) => {
          //     console.log(`${rating}: ${count}`);
          //   });
          //   console.log("-----------------------------------");
          // }));

          //   const data = await RatingsAndReview.aggregate([
          //    //{ $match: filter },
          //   {
          //     $group: {
          //       _id: '$reviewee_id',
          //       count: { $sum: 1 },
          //       latestRecords: { $push: '$$ROOT' },
          //     },
          //   },
          //   {
          //     $addFields: {
          //       last_game: {
          //         $arrayElemAt: ['$latestRecords', 0],
          //       },
          //       //totalRecords: { $size: "$latestRecords" },
          //     },
          //   },
          //   {
          //     $lookup: {
          //       from: 'users',
          //       localField: '_id',
          //       foreignField: '_id',
          //       as: 'user',
          //     },
          //   },
          //   {
          //     $unwind: '$user',
          //   },
          //   {
          //     $sort: { count: -1 },
          //   },
          //   {
          //     $limit: 13,
          //   },
          // ]);

          return _RS.apiNew(
            res,
            true,
            "Restaurant list get successfully",
            {
              data: {
                top,
                bottom,
              },
            },
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    // restaurant rating --
    this.router.get(
      "/restaurant/rate",
      Authentication.admin,
      checkPermission(Permissions.RATING_AND_REVIEWS),
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
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          let year = new Date().getFullYear();
          const filter: any = {
            ...req.filter,
            reviewee_id: { $ne: null },
            rating_for: "Restaurant",
          };

          if (req.country_id)
            filter.country_id = new mongoose.Types.ObjectId(req.country_id);
          if (req.query.city_id)
            filter.city_id = new mongoose.Types.ObjectId(req.query.city_id);
          if (req.query.year) {
            year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }
          let rate = req.query.rate?.toString();
          if (rate) {
            switch (rate) {
              case "2":
                filter.rating = { $lte: 2 };
                break;
              case "3":
                filter.rating = { $gte: 2, $lt: 4 };
                break;
              case "4":
                filter.rating = { $gte: 4 };
                break;
              default:
                break;
            }
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
          let sort: any = { created_at: -1 };

          let page = 1;
          let pageSize = 100;

          // const filter: any = { is_delete: false };

          if (req.query.page) page = parseInt(req.query.page);
          if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

          if (req.query.search && req.query.search.trim()) {
            filter.$or = [
              {
                review: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
            ];
          }
          if (req.query.start_date && req.query.end_date) {
            filter.created_at = {
              $gte: new Date(req.query.start_date + "T00:00:00Z"),
              $lte: new Date(req.query.end_date + "T23:59:59Z"),
            };
          }

          if (req.query.status) {
            var arrayValues = req.query.status.split(",");
            var booleanValues = arrayValues.map(function (value) {
              return value.toLowerCase() === "true";
            });
            filter.is_active = { $in: booleanValues };
          }

          const skipDocuments = (page - 1) * pageSize;
          let total = await RatingsAndReview.countDocuments(filter);

          const pipeline: any = [
            {
              $match: {
                ...filter,
              },
            },
            {
              $lookup: {
                from: "restaurants",
                localField: "reviewee_id",
                foreignField: "_id",
                as: "reviewee_id",
              },
            },
            {
              $unwind: {
                path: "$reviewee_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "reviewer_id",
                foreignField: "_id",
                as: "reviewer_id",
              },
            },
            {
              $unwind: {
                path: "$reviewer_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "orders",
                localField: "order_id",
                foreignField: "_id",
                as: "order_id",
              },
            },
            {
              $unwind: {
                path: "$order_id",
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

          const data = await RatingsAndReview.aggregate(pipeline);

          return _RS.apiNew(
            res,
            true,
            "Restaurant Rating list get successfully",
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
    // Driver Data
    this.router.get(
      "/driver",
      Authentication.admin,
      checkPermission(Permissions.RATING_AND_REVIEWS),
      [
        // query('page').notEmpty().withMessage('Valid page number must be provided'),
        // query('pageSize').notEmpty().withMessage('Valid page number must be provided'),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          let year = new Date().getFullYear();
          const filter: any = { ...req.filter };

          if (req.country_id)
            filter.country_id = new mongoose.Types.ObjectId(req.country_id);
          if (req.query.city_id)
            filter.city_id = new mongoose.Types.ObjectId(req.query.city_id);
          if (req.query.year) {
            year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }
          let rate = req.query.rate;
          if (rate) {
            switch (rate) {
              case "2":
                filter.rating = { $gte: 3, $lt: 2 };
                break;
              case "3":
                filter.rating = { $gte: 4, $lt: 3 };
                break;
              case "4":
                filter.rating = { $gte: 4 };
                break;
              default:
                break;
            }
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

          const [top, bottom] = await Promise.all([
            RatingsAndReview.aggregate([
              {
                $match: {
                  reviewee_id: { $ne: null },
                  rating_for: Rating.Driver,
                  ...filter,
                },
              },
              {
                $group: {
                  _id: "$reviewee_id",
                  averageRating: { $avg: "$rating" }, // Calculate average rating for each restaurant
                  ratingsCount: {
                    $push: {
                      rating: "$rating",
                      count: 1,
                    },
                  },
                },
              },
              {
                $addFields: {
                  averageRating: "$averageRating",
                },
              },
              {
                $addFields: {
                  total: { $size: "$ratingsCount" },
                },
              },
              {
                $unwind: "$ratingsCount", // Unwind the ratingsCount array
              },
              {
                $group: {
                  _id: {
                    driverId: "$_id",
                    rating: "$ratingsCount.rating", // Group by driverId and rating
                  },
                  averageRating: { $first: "$averageRating" },
                  total: { $first: "$total" },
                  count: { $sum: "$ratingsCount.count" }, // Sum up the counts for each rating
                },
              },
              {
                $group: {
                  _id: "$_id.driverId",
                  total: { $first: "$total" },
                  averageRating: { $first: "$averageRating" }, // Preserve the averageRating
                  ratingsCount: {
                    $push: {
                      rating: "$_id.rating",
                      count: "$count",
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  averageRating: 1,
                  ratingsCount: 1,
                  total: 1,
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "_id",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $unwind: "$user",
              },
              {
                $sort: { averageRating: -1 }, // Sort by average rating in descending order
              },
              {
                $limit: 5, // Limit to top 5 restaurants
              },
            ]),
            RatingsAndReview.aggregate([
              {
                $match: {
                  reviewee_id: { $ne: null },
                  rating_for: Rating.Driver,
                  ...filter,
                },
              },
              {
                $group: {
                  _id: "$reviewee_id",
                  averageRating: { $avg: "$rating" }, // Calculate average rating for each restaurant
                  ratingsCount: {
                    $push: {
                      rating: "$rating",
                      count: 1,
                    },
                  },
                },
              },
              {
                $addFields: {
                  averageRating: "$averageRating",
                },
              },
              {
                $addFields: {
                  total: { $size: "$ratingsCount" },
                },
              },
              {
                $unwind: "$ratingsCount", // Unwind the ratingsCount array
              },
              {
                $group: {
                  _id: {
                    driverId: "$_id",
                    rating: "$ratingsCount.rating", // Group by driverId and rating
                  },
                  total: { $first: "$total" },
                  averageRating: { $first: "$averageRating" },
                  count: { $sum: "$ratingsCount.count" }, // Sum up the counts for each rating
                },
              },
              {
                $group: {
                  _id: "$_id.driverId",
                  total: { $first: "$total" },
                  averageRating: { $first: "$averageRating" }, // Preserve the averageRating
                  ratingsCount: {
                    $push: {
                      rating: "$_id.rating",
                      count: "$count",
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  averageRating: 1,
                  ratingsCount: 1,
                  total: 1,
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "_id",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $unwind: "$user",
              },
              {
                $sort: { averageRating: 1 }, // Sort by average rating in descending order
              },
              {
                $limit: 5, // Limit to top 5 restaurants
              },
            ]),
          ]);

          return _RS.apiNew(
            res,
            true,
            "Driver rating list  get successfully",
            {
              data: {
                top,
                bottom,
              },
            },
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );
    // Driver rating list
    this.router.get(
      "/driver/rate",
      Authentication.admin,
      checkPermission(Permissions.RATING_AND_REVIEWS),
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
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          let year = new Date().getFullYear();
          const filter: any = {
            ...req.filter,
            reviewee_id: { $ne: null },
            rating_for: "Driver",
          };

          if (req.country_id)
            filter.country_id = new mongoose.Types.ObjectId(req.country_id);
          if (req.query.city_id)
            filter.city_id = new mongoose.Types.ObjectId(req.query.city_id);
          if (req.query.year) {
            year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }
          let rate = req.query.rate;
          if (rate) {
            switch (rate) {
              case "2":
                filter.rating = { $gte: 3, $lt: 2 };
                break;
              case "3":
                filter.rating = { $gte: 4, $lt: 3 };
                break;
              case "4":
                filter.rating = { $gte: 4 };
                break;
              default:
                break;
            }
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

          let sort: any = { created_at: -1 };
          let page = 1;
          let pageSize = 100;
          if (req.query.page) page = parseInt(req.query.page);
          if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

          if (req.query.search && req.query.search.trim()) {
            filter.$or = [
              {
                review: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
            ];
          }
          if (req.query.start_date && req.query.end_date) {
            filter.created_at = {
              $gte: new Date(req.query.start_date + "T00:00:00Z"),
              $lte: new Date(req.query.end_date + "T23:59:59Z"),
            };
          }

          if (req.query.status) {
            var arrayValues = req.query.status.split(",");
            var booleanValues = arrayValues.map(function (value) {
              return value.toLowerCase() === "true";
            });

            filter.is_active = { $in: booleanValues };
          }

          const skipDocuments = (page - 1) * pageSize;
          let total = await RatingsAndReview.countDocuments(filter);

          const pipeline: any = [
            {
              $match: {
                ...filter,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "reviewer_id",
                foreignField: "_id",
                as: "reviewer_id",
              },
            },
            {
              $unwind: {
                path: "$reviewer_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "reviewee_id",
                foreignField: "_id",
                as: "reviewee_id",
              },
            },
            {
              $unwind: {
                path: "$reviewee_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "orders",
                localField: "order_id",
                foreignField: "_id",
                as: "order_id",
              },
            },
            {
              $unwind: {
                path: "$order_id",
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

          const data = await RatingsAndReview.aggregate(pipeline);

          return _RS.apiNew(
            res,
            true,
            "Driver Rating list get successfully",
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

    // Customer
    this.router.get(
      "/customer",
      Authentication.admin,
      checkPermission(Permissions.RATING_AND_REVIEWS),
      [
        // query('page').notEmpty().withMessage('Valid page number must be provided'),
        // query('pageSize').notEmpty().withMessage('Valid page number must be provided'),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          let year = new Date().getFullYear();
          const filter: any = { ...req.filter };

          if (req.country_id)
            filter.country_id = new mongoose.Types.ObjectId(req.country_id);
          if (req.query.city_id)
            filter.city_id = new mongoose.Types.ObjectId(req.query.city_id);
          if (req.query.year) {
            year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }
          let rate = req.query.rate;
          if (rate) {
            switch (rate) {
              case "2":
                filter.rating = { $gte: 3, $lt: 2 };
                break;
              case "3":
                filter.rating = { $gte: 4, $lt: 3 };
                break;
              case "4":
                filter.rating = { $gte: 4 };
                break;
              default:
                break;
            }
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
          const [top, bottom] = await Promise.all([
            RatingsAndReview.aggregate([
              {
                $match: {
                  reviewee_id: { $ne: null },
                  rating_for: Rating.Customer,
                  ...filter,
                },
              },
              {
                $group: {
                  _id: "$reviewee_id",
                  averageRating: { $avg: "$rating" }, // Calculate average rating for each restaurant
                  ratingsCount: {
                    $push: {
                      rating: "$rating",
                      count: 1,
                    },
                  },
                },
              },
              {
                $addFields: {
                  averageRating: "$averageRating",
                },
              },
              {
                $addFields: {
                  total: { $size: "$ratingsCount" },
                },
              },
              {
                $unwind: "$ratingsCount", // Unwind the ratingsCount array
              },
              {
                $group: {
                  _id: {
                    customerId: "$_id",
                    rating: "$ratingsCount.rating", // Group by customerId and rating
                  },
                  total: { $first: "$total" },
                  averageRating: { $first: "$averageRating" },
                  count: { $sum: "$ratingsCount.count" }, // Sum up the counts for each rating
                },
              },
              {
                $group: {
                  _id: "$_id.customerId",
                  total: { $first: "$total" },
                  averageRating: { $first: "$averageRating" }, // Preserve the averageRating
                  ratingsCount: {
                    $push: {
                      rating: "$_id.rating",
                      count: "$count",
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  averageRating: 1,
                  ratingsCount: 1,
                  total: 1,
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "_id",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $unwind: "$user",
              },
              {
                $sort: { averageRating: -1 }, // Sort by average rating in descending order
              },
              {
                $limit: 5, // Limit to top 5 restaurants
              },
            ]),
            RatingsAndReview.aggregate([
              {
                $match: {
                  reviewee_id: { $ne: null },
                  rating_for: Rating.Customer,
                  ...filter,
                },
              },
              {
                $group: {
                  _id: "$reviewee_id",
                  averageRating: { $avg: "$rating" }, // Calculate average rating for each restaurant
                  ratingsCount: {
                    $push: {
                      rating: "$rating",
                      count: 1,
                    },
                  },
                },
              },
              {
                $addFields: {
                  averageRating: "$averageRating",
                },
              },
              {
                $addFields: {
                  total: { $size: "$ratingsCount" },
                },
              },
              {
                $unwind: "$ratingsCount", // Unwind the ratingsCount array
              },
              {
                $group: {
                  _id: {
                    customerId: "$_id",
                    rating: "$ratingsCount.rating", // Group by customerId and rating
                  },
                  total: { $first: "$total" },
                  averageRating: { $first: "$averageRating" },
                  count: { $sum: "$ratingsCount.count" }, // Sum up the counts for each rating
                },
              },
              {
                $group: {
                  _id: "$_id.customerId",
                  total: { $first: "$total" },
                  averageRating: { $first: "$averageRating" }, // Preserve the averageRating
                  ratingsCount: {
                    $push: {
                      rating: "$_id.rating",
                      count: "$count",
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  averageRating: 1,
                  ratingsCount: 1,
                  total: 1,
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "_id",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $unwind: "$user",
              },
              {
                $sort: { averageRating: 1 }, // Sort by average rating in descending order
              },
              {
                $limit: 5, // Limit to top 5 restaurants
              },
            ]),
          ]);

          return _RS.apiNew(
            res,
            true,
            "Driver rating list  get successfully",
            {
              data: {
                top,
                bottom,
              },
            },
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );
    // Costumer rating list
    this.router.get(
      "/customer/rate",
      Authentication.admin,
      checkPermission(Permissions.RATING_AND_REVIEWS),
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
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          let year = new Date().getFullYear();
          const filter: any = {
            ...req.filter,
            reviewee_id: { $ne: null },
            rating_for: "Customer",
          };

          if (req.country_id)
            filter.country_id = new mongoose.Types.ObjectId(req.country_id);
          if (req.query.city_id)
            filter.city_id = new mongoose.Types.ObjectId(req.query.city_id);
          if (req.query.year) {
            year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }
          let rate = req.query.rate;
          if (rate) {
            switch (rate) {
              case "2":
                filter.rating = { $gte: 3, $lt: 2 };
                break;
              case "3":
                filter.rating = { $gte: 4, $lt: 3 };
                break;
              case "4":
                filter.rating = { $gte: 4 };
                break;
              default:
                break;
            }
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

          let sort: any = { created_at: -1 };

          let page = 1;
          let pageSize = 100;

          // const filter: any = { is_delete: false };

          if (req.query.page) page = parseInt(req.query.page);
          if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

          if (req.query.search && req.query.search.trim()) {
            filter.$or = [
              {
                review: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
            ];
          }
          if (req.query.start_date && req.query.end_date) {
            filter.created_at = {
              $gte: new Date(req.query.start_date + "T00:00:00Z"),
              $lte: new Date(req.query.end_date + "T23:59:59Z"),
            };
          }

          if (req.query.status) {
            var arrayValues = req.query.status.split(",");
            var booleanValues = arrayValues.map(function (value) {
              return value.toLowerCase() === "true";
            });

            filter.is_active = { $in: booleanValues };
          }

          const skipDocuments = (page - 1) * pageSize;
          let total = await RatingsAndReview.countDocuments(filter);

          const pipeline: any = [
            {
              $match: {
                ...filter,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "reviewer_id",
                foreignField: "_id",
                as: "reviewer_id",
              },
            },
            {
              $unwind: {
                path: "$reviewer_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "reviewee_id",
                foreignField: "_id",
                as: "reviewee_id",
              },
            },
            {
              $unwind: {
                path: "$reviewee_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "orders",
                localField: "order_id",
                foreignField: "_id",
                as: "order_id",
              },
            },
            {
              $unwind: {
                path: "$order_id",
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

          const data = await RatingsAndReview.aggregate(pipeline);

          return _RS.apiNew(
            res,
            true,
            "Customer Rating list get successfully",
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

    // app
    this.router.get(
      "/app",
      Authentication.admin,
      checkPermission(Permissions.RATING_AND_REVIEWS),
      [],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          let year = new Date().getFullYear();
          const filter: any = { ...req.filter };

          if (req.query.country_id)
            filter.country_id = new mongoose.Types.ObjectId(
              req.query.country_id
            );
          if (req.query.city_id)
            filter.city_id = new mongoose.Types.ObjectId(req.query.city_id);
          if (req.query.year) {
            year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }
          let rate = req.query.rate;
          if (rate) {
            switch (rate) {
              case "2":
                filter.rating = { $gte: 3, $lt: 2 };
                break;
              case "3":
                filter.rating = { $gte: 4, $lt: 3 };
                break;
              case "4":
                filter.rating = { $gte: 4 };
                break;
              default:
                break;
            }
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
          const [top, all] = await Promise.all([
            RatingsAndReview.aggregate([
              {
                $match: {
                  reviewee_id: { $ne: null },
                  rating_for: Rating.App,
                  is_delete: false,
                  ...filter,
                },
              },
              {
                $group: {
                  _id: "$reviewee_id",
                  averageRating: { $avg: "$rating" }, // Calculate average rating for each restaurant
                  ratingsCount: {
                    $push: {
                      rating: "$rating",
                      count: 1,
                    },
                  },
                },
              },
              {
                $addFields: {
                  averageRating: "$averageRating",
                },
              },
              {
                $addFields: {
                  total: { $size: "$ratingsCount" },
                },
              },
              {
                $unwind: "$ratingsCount", // Unwind the ratingsCount array
              },
              {
                $group: {
                  _id: {
                    customerId: "$_id",
                    rating: "$ratingsCount.rating", // Group by customerId and rating
                  },
                  total: { $first: "$total" },
                  averageRating: { $first: "$averageRating" },
                  count: { $sum: "$ratingsCount.count" }, // Sum up the counts for each rating
                },
              },
              {
                $group: {
                  _id: "$_id.customerId",
                  total: { $first: "$total" },
                  averageRating: { $first: "$averageRating" }, // Preserve the averageRating
                  ratingsCount: {
                    $push: {
                      rating: "$_id.rating",
                      count: "$count",
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  averageRating: 1,
                  ratingsCount: 1,
                  total: 1,
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "_id",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $unwind: "$user",
              },
              {
                $sort: { averageRating: -1 }, // Sort by average rating in descending order
              },
              {
                $limit: 5, // Limit to top 5 restaurants
              },
            ]),
            RatingsAndReview.aggregate([
              {
                $match: {
                  reviewee_id: { $ne: null },
                  rating_for: Rating.App,
                  is_delete: false,
                  ...filter,
                },
              },

              {
                $lookup: {
                  from: "users",
                  localField: "reviewer_id",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $unwind: "$user",
              },
              {
                $sort: { created_at: -1 }, // Sort by average rating in descending order
              },
              {
                $limit: 5, // Limit to top 5 restaurants
              },
            ]),
          ]);

          return _RS.apiNew(
            res,
            true,
            "App rating list  get successfully",
            {
              data: {
                top: top.length ? top[0] : null,
                all,
              },
            },
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );
    // App Rating
    this.router.get(
      "/app/rate",
      Authentication.admin,
      checkPermission(Permissions.RATING_AND_REVIEWS),
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
      async (req, res, next) => {
        try {
          console.log("App Rating List 1 ");

          const startTime = new Date().getTime();
          let year = new Date().getFullYear();
          const filter: any = {
            ...req.filter,
            reviewee_id: { $ne: null },
            rating_for: "App",
          };

          if (req.country_id)
            filter.country_id = new mongoose.Types.ObjectId(req.country_id);
          if (req.query.city_id)
            filter.city_id = new mongoose.Types.ObjectId(req.query.city_id);
          if (req.query.year) {
            year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }
          let rate = req.query.rate.toString();
          if (rate) {
            switch (rate) {
              case "2":
                filter.rating = { $lte: 2 };
                break;
              case "3":
                filter.rating = { $gte: 2, $lt: 4 };
                break;
              case "4":
                filter.rating = { $gte: 4 };
                break;
              default:
                break;
            }
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

          let sort: any = { created_at: -1 };
          let page = 1;
          let pageSize = 100;

          if (req.query.page) page = parseInt(req.query.page);
          if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

          if (req.query.search && req.query.search.trim()) {
            filter.$or = [
              {
                review: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
            ];
          }

          if (req.query.start_date && req.query.end_date) {
            filter.created_at = {
              $gte: new Date(req.query.start_date + "T00:00:00Z"),
              $lte: new Date(req.query.end_date + "T23:59:59Z"),
            };
          }

          if (req.query.status) {
            var arrayValues = req.query.status.split(",");
            var booleanValues = arrayValues.map(function (value) {
              return value.toLowerCase() === "true";
            });

            filter.is_active = { $in: booleanValues };
          }

          const skipDocuments = (page - 1) * pageSize;
          let total = await RatingsAndReview.countDocuments(filter);

          const pipeline: any = [
            {
              $match: {
                ...filter,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "reviewer_id",
                foreignField: "_id",
                as: "reviewer_id",
              },
            },
            {
              $unwind: {
                path: "$reviewer_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "reviewee_id",
                foreignField: "_id",
                as: "reviewee_id",
              },
            },
            {
              $unwind: {
                path: "$reviewee_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "orders",
                localField: "order_id",
                foreignField: "_id",
                as: "order_id",
              },
            },
            {
              $unwind: {
                path: "$order_id",
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

          const data = await RatingsAndReview.aggregate(pipeline);

          return _RS.apiNew(
            res,
            true,
            "App Rating list get successfully",
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
      "/filters",
      Authentication.admin,
      checkPermission(Permissions.DRIVER),
      [
        query("rating_for")
          .notEmpty()
          .isIn(Object.values(Rating))
          .withMessage("Valid query must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const rating_for = req.query.rating_for;

          // const statuses = [ApproveStatus.PENDING, ApproveStatus.REJECT]

          const filter: any = {
            rating_for,
            ...req.filter,
          };

          if (req.country_id) filter.country_id = req.country_id;

          const data = await RatingsAndReview.find({ ...filter }).select(
            "reviewee_id country_id created_at city_id"
          );

          const cityIds = [...new Set(data.map(({ city_id }: any) => city_id))];
          let userIds;
          let promise;

          if (rating_for == Rating.Restaurant) {
            userIds = [
              ...new Set(data.map(({ reviewee_id }: any) => reviewee_id)),
            ];
            promise = Restaurant.find({ _id: { $in: userIds } }).select(
              "_id name ar_name"
            );
          } else {
            userIds = [
              ...new Set(data.map(({ reviewee_id }: any) => reviewee_id)),
            ];
            promise = User.find({ _id: { $in: userIds } }).select(
              "_id name ar_name"
            );
          }

          const [year, city, user] = await Promise.all([
            Helper.getYearAndMonth(data),
            ServiceCity.find({ _id: { $in: cityIds } }),
            promise,
          ]);

          return _RS.apiNew(
            res,
            true,
            `${rating_for} list get successfully`,
            {
              // data: city,
              city,
              user,
              ...year,
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

export default new RatingRouter().router;
