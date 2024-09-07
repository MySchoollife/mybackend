import { Router } from "express";
import * as mongoose from "mongoose";
import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import _RS from "../../helpers/ResponseHelper";
import Banner from "../../models/Banner";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import Helper from "../../helpers/Helper";
import { UserTypes } from "../../models/User";
import { changeLog } from "../../helpers/function";
import { ChangeLogAction } from "../../models/ChangeLog";

class BannerRouter {
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
      checkPermission(Permissions.CMS),
      [
        body("image").notEmpty().withMessage("Valid image must be provided"),
        body("start_date")
          .notEmpty()
          .withMessage("Valid start_date must be provided"),
        body("end_date")
          .notEmpty()
          .withMessage("Valid end_date must be provided"),
        body("position")
          .notEmpty()
          .withMessage("Valid position must be provided"),
        body("rotation_time")
          .notEmpty()
          .withMessage("Valid rotation time must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const added_by = req.user.id;
          const country_id = req.country_id;

          const {
            image,
            start_date,
            end_date,
            position,
            rotation_time,
            is_active,
            banner_link,
            banner_for,
            category_id,
            vendor_id,
            mobile_image,
          } = req.body;

          const addBanner = await Banner.create({
            country_id,
            image,
            start_date,
            end_date,
            position,
            rotation_time,
            is_active,
            banner_link,
            banner_for,
            category_id,
            vendor_id,
            mobile_image,
          });

          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.ADD,
              `Added Banner ${addBanner?.position}.`,
              req.user.id
            );
          }

          return _RS.apiNew(
            res,
            true,
            "Banner added successfully",
            addBanner,
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );

    this.router.put(
      "/:id",
      Authentication.admin,
      checkPermission(Permissions.CMS),
      [
        param("id")
          .notEmpty()
          .isMongoId()
          .withMessage("Valid id must be provided"),

        body("image").notEmpty().withMessage("Valid image must be provided"),
        body("start_date")
          .notEmpty()
          .withMessage("Valid start_date must be provided"),
        body("end_date")
          .notEmpty()
          .withMessage("Valid end_date must be provided"),
        body("position")
          .notEmpty()
          .withMessage("Valid position must be provided"),
        body("rotation_time")
          .notEmpty()
          .withMessage("Valid rotation time must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const id = req.params.id;
          const country_id = req.country_id;
          const {
            image,
            start_date,
            end_date,
            position,
            rotation_time,
            is_active,
            banner_link,
            banner_for,
            category_id,
            vendor_id,
            mobile_image,
          } = req.body;

          const banner = await Banner.findById(id);

          if (!banner) {
            return _RS.apiNew(res, false, "Banner not found", {}, startTime);
          }

          banner.image = image ? image : banner.image;
          banner.start_date = start_date ? start_date : banner.start_date;
          banner.end_date = end_date ? end_date : banner.end_date;
          banner.position = position ? position : banner.position;
          banner.mobile_image = mobile_image
            ? mobile_image
            : banner.mobile_image;
          banner.rotation_time = rotation_time
            ? rotation_time
            : banner.rotation_time;
          banner.country_id = country_id;
          banner.is_active = is_active;
          banner.banner_link = banner_link;
          banner.banner_for = banner_for;
          banner.category_id = category_id;
          banner.vendor_id = vendor_id;

          await banner.save();

          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.UPDATE,
              `Updated Banner ${banner?.position}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Banner updated successfully",
            { data: banner },
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );

    this.router.put(
      "/status/:id",
      Authentication.admin,
      checkPermission(Permissions.CMS),
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

          const choice = await Banner.findById(id);

          if (!choice) {
            return _RS.apiNew(res, false, "Banner not found", {}, startTime);
          }

          choice.is_active = !choice.is_active;

          await choice.save();

          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.STATUS,
              `Changed Status Banner ${choice?.position}.`,
              req.user.id
            );
          }

          return _RS.apiNew(
            res,
            true,
            "Banner status changed successfully",
            choice,
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.post(
      "/check-order",
      Authentication.admin,
      checkPermission(Permissions.CMS),
      [body("order").notEmpty().withMessage("Valid order must be provided")],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const { order } = req.body;

          const getData = await Banner.findOne({ order: order });

          if (getData) {
            return _RS.apiNew(
              res,
              false,
              "Order Number Already Assign Other Banner",
              {},
              startTime
            );
          }

          return _RS.apiNew(
            res,
            true,
            "Banner order check successfully",
            {},
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
      checkPermission(Permissions.CMS),
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

          const user = await Banner.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "Banner not found", {}, startTime);
          }

          user.is_delete = true;

          await user.save();

          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.DELETE,
              `Deleted  Banner ${user?.position}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Banner deleted successfully",
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
      checkPermission(Permissions.CMS),
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

          let sort: any = { created_at: -1 };
          const country_id = req.country_id;
          let page = 1;
          let pageSize = 10000;

          const filter: any = {
            is_delete: false,
          };

          console.log("req.query.position", req.query.position);
          if (req.query.page) page = parseInt(req.query.page);
          if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);
          if (req.query.city_id)
            filter.city_ids = {
              $in: [new mongoose.Types.ObjectId(req.query.city_id)],
            };
          if (req.query.banner_for) filter.banner_for = req.query.banner_for;
          if (req.query.position)
            filter.position = { $regex: new RegExp(req.query.position, "i") };
          if (req.query.status) {
            var arrayValues = req.query.status.split(",");
            var booleanValues = arrayValues.map(function (value) {
              return value.toLowerCase() === "true";
            });
            filter.is_active = { $in: booleanValues };
          }

          if (req.query.search) {
            const search = req.query.search.trim();
            filter.$or = [
              {
                position: {
                  $regex: new RegExp(search),
                  $options: "i",
                },
              },
            ];
          }

          const skip = (page - 1) * pageSize;

          let total = await Banner.countDocuments(filter);

          // const data = await Banner.find(filter)
          //   .populate({ path: "restaurant_id" })
          //   .populate({ path: "city_ids" })
          //   .skip(skip)
          //   .limit(pageSize)
          //   .sort({ created_at: -1 });

          console.log(JSON.stringify(filter), "lll");

          const data = await Banner.aggregate([
            {
              $match: { ...filter },
            },

            {
              $sort: {
                created_at: -1,
              },
            },
            {
              $skip: skip,
            },
            {
              $limit: pageSize,
            },
          ]);

          return _RS.apiNew(
            res,
            true,
            "Banner retrieved successfully",
            {
              data,
              total,
              page,
              pageSize,
            },
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );

    this.router.get(
      "/filters",
      Authentication.admin,
      checkPermission(Permissions.CMS),
      [],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = { is_delete: false };
          const cfilter: any = {};
          // const filter: any = { is_delete: false, type: UserTypes.CUSTOMER, }

          if (req.country_id) filter.country_id = req.country_id;

          if (req.user.type == "SubAdmin") {
            filter["city_ids"] = {
              $in: req.user.city_ids.map(
                (id) => new mongoose.Types.ObjectId(id)
              ),
            };
          }

          const data = await Banner.find({ ...filter }).select(
            "city_ids country_id created_at"
          );

          console.log(data, "data");

          const cityIds = [
            ...new Set(data.map(({ city_ids }: any) => city_ids).flat()),
          ];
          console.log(cityIds, "cityIds");

          if (req.user.type == "SubAdmin") {
            cfilter["_id"] = { $in: req.user.city_ids };
          } else {
            cfilter["_id"] = { $in: cityIds };
          }

          return _RS.apiNew(
            res,
            true,
            "Filter list  get successfully",
            {},
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

export default new BannerRouter().router;
