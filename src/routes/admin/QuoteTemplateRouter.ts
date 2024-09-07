import * as mongoose from "mongoose";
import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import { SubCategoryController } from "../../controllers/Admin/SubCategoryController";
import QuoteTemplate from "../../models/QuoteTemplate";
import { body, param, query } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import _RS from "../../helpers/ResponseHelper";
import Category from "../../models/Category";


class QuoteRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
  }

  public post() {
    this.router.post("/", Authentication.admin,
      checkPermission(Permissions.QUOTETEMPLATE),
      [
        body('name').notEmpty().withMessage('Valid name must be provided'),
        body('ar_name').notEmpty().withMessage('Valid ar_name must be provided'),
        body('is_active').notEmpty().optional().withMessage('Valid is_active must be provided'),
        body('country_id').notEmpty().withMessage('Valid country  must be provided'),
        body('category_id').notEmpty().withMessage('Valid Category  must be provided'),
        body('is_required').notEmpty().optional().withMessage('Valid  required  must be provided'),
        body('attribute_id').notEmpty().isArray().optional().withMessage('Valid  attribute  must be provided'),
        body('options').optional().notEmpty().withMessage('Valid options Array must be provided'),
        // body('type').notEmpty().optional().withMessage('Valid options Array must be provided'),
        body('service_id').notEmpty().withMessage('Valid Service  must be provided'),


      ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { image, name, ar_name, is_active, country_id, category_id, service_id, is_required, type, options, attribute_id } = req.body;

          const serviceData = await QuoteTemplate.findOne({ name: name, country_id: country_id });

          if (serviceData) {
            return _RS.conflict(
              res,
              "COFLICT",
              "Quote Template already exist with this name",
              serviceData,
              startTime,
            );
          }

          const service = await new QuoteTemplate({
            name: name,
            ar_name: ar_name,
            added_by: "Admin",
            is_required,
            is_active,
            country_id,
            category_id,
            attribute_id,
            options,
            service_id,
            type

          }).save();

          return _RS.created(
            res,
            "SUCCESS",
            "Quote Template has been added successfully",
            service,
          );
        } catch (err) {
          next(err);
        }
      });


    this.router.put("/:id", Authentication.admin,
      checkPermission(Permissions.QUOTETEMPLATE),
      [
        // body('image').optional().notEmpty().withMessage('Valid image must be provided'),
        body('name').notEmpty().withMessage('Valid name must be provided'),
        body('ar_name').notEmpty().withMessage('Valid ar_name must be provided'),
        body('is_active').notEmpty().optional().withMessage('Valid is_active must be provided'),
        body('country_id').notEmpty().withMessage('Valid country  must be provided'),
        body('category_id').notEmpty().withMessage('Valid Category  must be provided'),
        body('options').optional().notEmpty().isArray().withMessage('Valid options Array must be provided'),
        // body('type').optional().notEmpty().withMessage('Valid  type must be provided'),
        body('attribute_id').notEmpty().isArray().optional().withMessage('Valid  attribute  must be provided'),
        body('service_id').notEmpty().withMessage('Valid Service  must be provided'),
      ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { image, name, ar_name, is_active, country_id, category_id, service_id, is_required, type, options, attribute_id } = req.body;
          const id = req.params.id;

          const getService = await QuoteTemplate.findById(id);

          if (!getService) {
            return _RS.notFound(
              res,
              "NOTFOUND",
              "Quote Template Not Found",
              {},
              startTime,
            );
          }

          getService.name = name ? name : getService.name
          getService.ar_name = ar_name ? ar_name : getService.ar_name
          getService.category_id = category_id ? category_id : getService.category_id
          getService.service_id = service_id ? service_id : getService.service_id
          getService.country_id = country_id ? country_id : getService.country_id
          getService.type = type ? type : getService.type
          getService.options = options ? options : getService.options
          getService.attribute_id = attribute_id ? attribute_id : getService.attribute_id
          getService.is_active = is_active
          getService.is_required = is_required
          getService.save()

          return _RS.ok(
            res,
            "SUCCESS",
            "Quote Template has been update successfully",
            getService,
            startTime,
          );
        } catch (err) {
          next(err);
        }
      });

    this.router.post("/import-file/:type", Authentication.admin, async (req, res, next) => {
      try {
        const startTime = new Date().getTime();
        const { import_file } = req.body;
        const saveService = import_file.map(async (item, index) => {
          await QuoteTemplate.create({
            image: item.image,
            type: req.params.type,
            name: item.name.trim().toLowerCase(),
            status:
              item.status == "Active" || item.status == "active" ? true : false,
            added_by: "Excel",
          });
        });
        return _RS.ok(
          res,
          "SUCCESS",
          "Import Quote Template  successfully",
          saveService,
          startTime,
        );
      } catch (err) {
        next(err);
      }
    });
  }

  public get() {
    this.router.get("/", Authentication.admin, checkPermission(Permissions.QUOTETEMPLATE), [
      // query('page').notEmpty().withMessage('Valid page number must be provided'),
      // query('pageSize').notEmpty().withMessage('Valid page number must be provided'),
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
            limit: req.query.limit || 100,
            collation: {
              locale: "en",
            },
          };

          let filteredQuery: any = {
            is_delete: false,
            country_id: new mongoose.Types.ObjectId(req.country_id)
          };
          if (req.query.search && req.query.search.trim()) {
            filteredQuery.$or = [
              {
                name: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
            ];
          }

          if (req.params.type && req.params.type.trim()) {
            filteredQuery.type = req.params.type;
          }

          if (req.query.status) {
            var arrayValues = req.query.status.split(",");
            var booleanValues = arrayValues.map(function (value) {
              return value.toLowerCase() === "true";
            });
            filteredQuery.is_active = { $in: booleanValues };
          }

          if (req.query.category_id) {
            filteredQuery.category_id = new mongoose.Types.ObjectId(req.query.category_id);
          }

          let query: any = [
            {
              $match: filteredQuery,
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
              $lookup: {
                from: "services",
                localField: "service_id",
                foreignField: "_id",
                as: "service_id"
              }
            },

            {
              $unwind: {
                path: "$service_id",
                preserveNullAndEmptyArrays: true
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

          // const sdata = await Promise.all(list.docs.map(async (item) => {
          //   const haveItem = await Restaurant.findOne({ category_id: { $elemMatch: { $in: [item._id] } }, country_id: req.country_id, is_delete: false })
          //   return ({
          //     ...item,
          //     have_item: haveItem ? true : false
          //   })
          // }))

          // const adata = await Promise.all(sdata.map(async (item) => {
          //   const haveActiveItem = await Restaurant.findOne({ category_id: { $elemMatch: { $in: [item._id] } }, country_id: req.country_id, is_delete: false, is_active: true })
          //   return ({
          //     ...item,
          //     have_active_item: haveActiveItem ? true : false
          //   })
          // }))

          // list = { ...list, docs: adata }

          return _RS.ok(res, "SUCCESS", "Quote Template List", { data: list }, startTime);
        } catch (err) {
          next(err);
        }
      });

    this.router.put("/status/:id", Authentication.admin, checkPermission(Permissions.QUOTETEMPLATE), async (req, res, next) => {
      try {
        const startTime = new Date().getTime();

        const getService = await QuoteTemplate.findOne({ _id: req.params.id });

        if (!getService) {
          return _RS.notFound(
            res,
            "NOTFOUND",
            "Quote Template not found",
            getService,
            startTime,
          );
        }

        getService.is_active = !getService.is_active
        await getService.save();

        return _RS.ok(
          res,
          "SUCCESS",
          "Quote Template  Status changed successfully",
          getService,
          startTime,
        );
      } catch (err) {
        next(err);
      }
    });

    this.router.delete("/:id",
      Authentication.admin,
      checkPermission(Permissions.QUOTETEMPLATE),
      [
        param('id').notEmpty().isMongoId().withMessage('Valid Attribute id must be provided'),
      ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const getService = await QuoteTemplate.findOne({ _id: req.params.id });

          if (!getService) {
            return _RS.notFound(
              res,
              "NOTFOUND",
              "Quote Template  not found",
              getService,
              startTime,
            );
          }


          getService.is_delete = true
          await getService.save();
          // await getService.remove();

          return _RS.ok(
            res,
            "SUCCESS",
            "Quote Template deleted successfully",
            getService,
            startTime,
          );
        } catch (err) {
          next(err);
        }
      });


    this.router.post("/delete-all",
      Authentication.admin,
      checkPermission(Permissions.QUOTETEMPLATE),
      [
        body('ids').notEmpty().isArray().withMessage('Valid Attribute ids must be provided'),
      ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const ids = req.body.ids

          const getService = await QuoteTemplate.updateMany({ _id: { $in: ids } }, { $set: { is_delete: true } });


          if (!getService) {
            return _RS.notFound(
              res,
              "NOTFOUND",
              "Quote Template not found",
              getService,
              startTime,
            );
          }

          return _RS.ok(
            res,
            "SUCCESS",
            "Quote Template deleted successfully",
            getService,
            startTime,
          );
        } catch (err) {
          next(err);
        }
      });

    this.router.get("/filters",
      Authentication.admin,
      checkPermission(Permissions.QUOTETEMPLATE),
      [

      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = { is_delete: false, ...req.filter }

          if (req.country_id) filter.country_id = req.country_id

          const data = await QuoteTemplate.find({ ...filter }).select('category_id country_id created_at')

          const ids = data.map(id => id.category_id)
          const category = await Category.find({ _id: { $in: ids } })

          return _RS.apiNew(
            res,
            true,
            "Filter list  get successfully",
            { data: category, },
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

export default new QuoteRouter().router;
