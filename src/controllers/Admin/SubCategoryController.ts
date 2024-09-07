import * as mongoose from "mongoose";

import _RS from "../../helpers/ResponseHelper";
import SubCategory from "../../models/SubCategory";
import Restaurant from "../../models/Provider";
import Service from "../../models/Serivces";
import { UserTypes } from "../../models/User";
import { ChangeLogAction } from "../../models/ChangeLog";
import { changeLog } from "../../helpers/function";

export class SubCategoryController {
  static async list(req, res, next) {
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
          {
            "category_id.name": {
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

      let query: any = [
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
          $match: filteredQuery,
        },
        {
          $sort: {
            created_at: -1,
          },
        },
      ];

      var myAggregate = SubCategory.aggregate(query);

      let list = await SubCategory.aggregatePaginate(myAggregate, options);

      const sdata = await Promise.all(
        list.docs.map(async (item) => {
          const haveItem = await Service.findOne({
            sub_category_id: item._id,
            country_id: req.country_id,
            is_delete: false,
          });
          return {
            ...item,
            have_item: haveItem ? true : false,
          };
        })
      );

      const adata = await Promise.all(
        sdata.map(async (item) => {
          const haveActiveItem = await Service.findOne({
            sub_category_id: item._id,
            country_id: req.country_id,
            is_delete: false,
            is_active: true,
          });
          return {
            ...item,
            have_active_item: haveActiveItem ? true : false,
          };
        })
      );

      list = { ...list, docs: adata };

      return _RS.ok(res, "SUCCESS", "List", list, startTime);
    } catch (err) {
      next(err);
    }
  }

  static async add(req, res, next) {
    try {
      const startTime = new Date().getTime();
      const {
        image,
        name,
        ar_name,
        is_active,
        country_id,
        category_id,
        is_request_quote,
        is_featured,
      } = req.body;

      const subCategoryData = await SubCategory.findOne({
        name: name,
        country_id: country_id,
      });

      if (subCategoryData) {
        return _RS.conflict(
          res,
          "COFLICT",
          "Sub Category already exist with this name",
          subCategoryData,
          startTime
        );
      }

      const subCategory = await SubCategory.create({
        name: name,
        ar_name: ar_name,
        added_by: "Admin",
        image: image ? image : null,
        is_active,
        country_id,
        category_id,
        is_request_quote,
        is_featured,
      });

      if (req.user.type == UserTypes.TEACHER) {
        await changeLog(
          ChangeLogAction.ADD,
          `Added New Sub Category ${subCategory?.name}.`,
          req.user.id
        );
      }

      return _RS.created(
        res,
        "SUCCESS",
        "Sub Category has been added successfully",
        subCategory
      );
    } catch (err) {
      next(err);
    }
  }

  static async edit(req, res, next) {
    try {
      const startTime = new Date().getTime();
      const {
        image,
        name,
        ar_name,
        is_active,
        country_id,
        category_id,
        is_featured,
        is_request_quote,
      } = req.body;
      const id = req.params.id;

      const getSubCategory = await SubCategory.findById(id);

      if (!getSubCategory) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Sub Category Not Found",
          {},
          startTime
        );
      }

      getSubCategory.name = name ? name : getSubCategory.name;
      getSubCategory.ar_name = ar_name ? ar_name : getSubCategory.ar_name;
      getSubCategory.category_id = category_id
        ? category_id
        : getSubCategory.category_id;
      getSubCategory.image = image ? image : getSubCategory.image;
      getSubCategory.country_id = country_id
        ? country_id
        : getSubCategory.country_id;
      getSubCategory.is_featured = is_featured;
      getSubCategory.is_request_quote = is_request_quote;
      getSubCategory.is_active = is_active;
      getSubCategory.save();

      if (req.user.type == UserTypes.TEACHER) {
        await changeLog(
          ChangeLogAction.UPDATE,
          `Updated Sub Category ${getSubCategory?.name}.`,
          req.user.id
        );
      }
      return _RS.ok(
        res,
        "SUCCESS",
        "Sub Category has been update successfully",
        getSubCategory,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async statusChange(req, res, next) {
    try {
      const startTime = new Date().getTime();

      const getSubCategory = await SubCategory.findOne({ _id: req.params.id });

      if (!getSubCategory) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Sub Category not found",
          getSubCategory,
          startTime
        );
      }

      getSubCategory.is_active = !getSubCategory.is_active;
      await getSubCategory.save();

      if (req.user.type == UserTypes.TEACHER) {
        await changeLog(
          ChangeLogAction.STATUS,
          `Changed Status Sub Category ${getSubCategory?.name}.`,
          req.user.id
        );
      }
      return _RS.ok(
        res,
        "SUCCESS",
        "Sub Category Status changed successfully",
        getSubCategory,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const startTime = new Date().getTime();

      const getSubCategory = await SubCategory.findOne({ _id: req.params.id });

      if (!getSubCategory) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Sub Category not found",
          getSubCategory,
          startTime
        );
      }

      getSubCategory.is_delete = true;
      await getSubCategory.save();
      // await getSubCategory.remove();

      if (req.user.type == UserTypes.TEACHER) {
        await changeLog(
          ChangeLogAction.DELETE,
          `Deleted Sub Category ${getSubCategory?.name}.`,
          req.user.id
        );
      }
      return _RS.ok(
        res,
        "SUCCESS",
        "Sub Category deleted successfully",
        getSubCategory,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async deleteAll(req, res, next) {
    try {
      const startTime = new Date().getTime();

      const ids = req.body.ids;

      const haveItem = await Service.findOne({
        sub_category_id: { $in: ids },
        country_id: req.country_id,
        is_delete: false,
      });
      console.log("haveItem", haveItem);
      if (haveItem) {
        return _RS.badRequest(
          res,
          "NOTFOUND",
          "This category contains service, please remove  this service from service Type before deleting Sub category",
          {},
          startTime
        );
      }

      const getSubCategory = await SubCategory.updateMany(
        { _id: { $in: ids } },
        { $set: { is_delete: true } }
      );

      if (!getSubCategory) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Sub Category not found",
          getSubCategory,
          startTime
        );
      }

      return _RS.ok(
        res,
        "SUCCESS",
        "Sub category's deleted successfully",
        getSubCategory,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async importFile(req, res, next) {
    try {
      const startTime = new Date().getTime();
      const { import_file } = req.body;
      const saveSubCategory = import_file.map(async (item, index) => {
        await SubCategory.create({
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
        "Import Sub category successfully",
        saveSubCategory,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }
}
