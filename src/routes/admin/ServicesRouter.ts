import * as mongoose from "mongoose";
import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import { SubCategoryController } from "../../controllers/Admin/SubCategoryController";
import Service from "../../models/Serivces";
import { body, param, query } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import _RS from "../../helpers/ResponseHelper";
import Restaurant from "../../models/Provider";
import Category from "../../models/Category";
import SubCategory from "../../models/SubCategory";
import Attribute from "../../models/Attribute";
import { UserTypes } from "../../models/User";
import { ChangeLogAction } from "../../models/ChangeLog";
import { changeLog } from "../../helpers/function";

class ServiceRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
  }

  public post() {
    this.router.post("/", Authentication.admin,
      checkPermission(Permissions.SERVICE),
      [
        // body('image').notEmpty().withMessage('Valid image must be provided'),
        body('name').notEmpty().withMessage('Valid name must be provided'),
        body('min_price').notEmpty().withMessage('Valid min_price must be provided'),
        body('max_price').notEmpty().withMessage('Valid max_price must be provided'),
        body('ar_name').notEmpty().withMessage('Valid ar_name must be provided'),
        body('is_active').notEmpty().withMessage('Valid is_active must be provided'),
        body('category_id').notEmpty().withMessage('Valid Category  must be provided'),
        body('sub_category_id').notEmpty().withMessage('Valid Sub Category  must be provided'),
      ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const {is_featured, image, name, ar_name, is_active, country_id, category_id, sub_category_id ,min_price,max_price} = req.body;

          const serviceData = await Service.findOne({ name: name, country_id: country_id, is_delete: false });

          if (serviceData) {
            return _RS.conflict(
              res,
              "COFLICT",
              "Service already exist with this name",
              serviceData,
              startTime,
            );
          }

          const service = await  Service.create({
            name: name,
            ar_name: ar_name,
            added_by: "Admin",
            image: image ? image : null,
            is_active,
            country_id,
            category_id,
            sub_category_id,
            is_featured,
            min_price,
            max_price
          });

       if (req.user.type == UserTypes.SUB_ADMIN) {
                        await changeLog(ChangeLogAction.ADD, `Added New Service ${service?.name}.`, req.user.id);
                      }
          return _RS.created(
            res,
            "SUCCESS",
            "Service has been added successfully",
            service,
          );
        } catch (err) {
          next(err);
        }
      });


    this.router.put("/:id", Authentication.admin,
      checkPermission(Permissions.SERVICE),
      [
        body('min_price').notEmpty().withMessage('Valid min_price must be provided'),
        body('max_price').notEmpty().withMessage('Valid max_price must be provided'),
        body('image').optional().notEmpty().withMessage('Valid image must be provided'),
        body('name').notEmpty().withMessage('Valid name must be provided'),
        body('ar_name').notEmpty().withMessage('Valid ar_name must be provided'),
        body('is_active').notEmpty().withMessage('Valid is_active must be provided'),
        body('category_id').notEmpty().withMessage('Valid Category  must be provided'),
        body('sub_category_id').notEmpty().withMessage('Valid Sub Category  must be provided'),
      ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { image, name, ar_name, is_active, country_id, category_id, sub_category_id ,is_featured,min_price,max_price } = req.body;
          const id = req.params.id;

          const getService = await Service.findById(id);

          if (!getService) {
            return _RS.notFound(
              res,
              "NOTFOUND",
              "Service Not Found",
              {},
              startTime,
            );
          }

          getService.name = name ? name : getService.name
          getService.ar_name = ar_name ? ar_name : getService.ar_name
          getService.category_id = category_id ? category_id : getService.category_id
          getService.sub_category_id = sub_category_id ? sub_category_id : getService.sub_category_id
          getService.image = image
          getService.country_id = country_id ? country_id : getService.country_id
          getService.is_active = is_active 
          getService.is_featured = is_featured  
          getService.min_price = min_price        
          getService.max_price = max_price        
          getService.save()

          if (req.user.type == UserTypes.SUB_ADMIN) {
            await changeLog(ChangeLogAction.UPDATE, `Update Service ${getService?.name}.`, req.user.id);
          }
          return _RS.ok(
            res,  
            "SUCCESS",
            "Service has been update successfully",
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
          await Service.create({
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
          "Import Service  successfully",
          saveService,
          startTime,
        );
      } catch (err) {
        next(err);
      }
    });
  }

  public get() {
    this.router.get("/", Authentication.admin, checkPermission(Permissions.SERVICE), [
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
          if (req.query.sub_category_id) {
            filteredQuery.sub_category_id = new mongoose.Types.ObjectId(req.query.sub_category_id);
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
            // {
            //   $lookup: {
            //     from: "subcategories",
            //     localField: "sub_category_id",
            //     foreignField: "_id",
            //     as: "sub_category_id"
            //   }
            // },
            // {
            //   $unwind: {
            //     path: "$sub_category_id",
            //     preserveNullAndEmptyArrays: true
            //   },
            // },
            {
              $sort: {
                created_at: -1,
              },
            },
          ];

          var myAggregate = Service.aggregate(query);



          let list = await Service.aggregatePaginate(myAggregate, options);

          const sdata = await Promise.all(list.docs.map(async (item) => {
            const haveItem = await Attribute.findOne({ service_id: item._id, country_id: req.country_id, is_delete: false })
            return ({
              ...item,
              have_item: haveItem ? true : false
            })
          }))

          const adata = await Promise.all(sdata.map(async (item) => {
            const haveActiveItem = await Attribute.findOne({ service_id: item._id, country_id: req.country_id, is_delete: false, is_active: true })
            return ({
              ...item,
              have_active_item: haveActiveItem ? true : false
            })
          }))

          list = { ...list, docs: adata }

          return _RS.ok(res, "SUCCESS", "List", { list: list }, startTime);
        } catch (err) {
          next(err);
        }
      });

    this.router.get("/status/:id", Authentication.admin, checkPermission(Permissions.SERVICE), async (req : any, res, next) => {
      try {
        const startTime = new Date().getTime();

        const getService = await Service.findOne({ _id: req.params.id });


        if (!getService) {
          return _RS.notFound(
            res,
            "NOTFOUND",
            "Service not found",
            getService,
            startTime,
          );
        }

        getService.is_active = !getService.is_active
        await getService.save();

         if (req.user.type == UserTypes.SUB_ADMIN) {
            await changeLog(ChangeLogAction.STATUS, `Changed Status Service ${getService?.name}.`, req.user.id);
          }
        return _RS.ok(
          res,
          "SUCCESS",
          "Service  Status changed successfully",
          getService,
          startTime,
        );
      } catch (err) {
        next(err);
      }
    });

    this.router.delete("/:id",
      Authentication.admin,
      checkPermission(Permissions.SERVICE),
      [
        param('id').notEmpty().isMongoId().withMessage('Valid Service id must be provided'),
      ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const getService = await Service.findOne({ _id: req.params.id });

          if (!getService) {
            return _RS.notFound(
              res,
              "NOTFOUND",
              "Service  not found",
              getService,
              startTime,
            );
          }


          getService.is_delete = true
          await getService.save();
          // await getService.remove();

          if (req.user.type == UserTypes.SUB_ADMIN) {
            await changeLog(ChangeLogAction.DELETE, `Deleted Service ${getService?.name}.`, req.user.id);
          }
          return _RS.ok(
            res,
            "SUCCESS",
            "Service deleted successfully",
            getService,
            startTime,
          );
        } catch (err) {
          next(err);
        }
      });


    this.router.post("/delete-all",
      Authentication.admin,
      checkPermission(Permissions.SERVICE),
      [
        body('ids').notEmpty().isArray().withMessage('Valid Sub category ids must be provided'),
      ],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const ids = req.body.ids

          const getService = await Service.updateMany({ _id: { $in: ids } }, { $set: { is_delete: true } });


          if (!getService) {
            return _RS.notFound(
              res,
              "NOTFOUND",
              "Service not found",
              getService,
              startTime,
            );
          }

          return _RS.ok(
            res,
            "SUCCESS",
            "Service's deleted successfully",
            getService,
            startTime,
          );
        } catch (err) {
          next(err);
        }
      });

    this.router.get("/filters",
      Authentication.admin,
      checkPermission(Permissions.SERVICE),
      [

      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = { is_delete: false, ...req.filter }

          if (req.country_id) filter.country_id = req.country_id

          const data = await Service.find({ ...filter }).select('category_id  country_id created_at')

          const ids = data.map(id => id.category_id)
          const category = await Category.find({ _id: { $in: ids } })

          // const subCategoryIds = data.map(id => id.sub_category_id)
          // const subCategory = await SubCategory.find({ _id: { $in: subCategoryIds } })

          return _RS.apiNew(
            res,
            true,
            "Filter list  get successfully",
            { data: category },
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

export default new ServiceRouter().router;
