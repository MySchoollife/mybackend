// import * as mongoose from "mongoose";

// import _RS from "../../helpers/ResponseHelper";
// import Category from "../../models/Category";
// import Restaurant from "../../models/Provider";
// import SubCategory from "../../models/SubCategory";

// export class CategoryController {
//   static async list(req, res, next) {
//     try {
//       const startTime = new Date().getTime();

//       let sort: any = [["createdAt", -1]];
//       if (req.query.sort) {
//         sort = Object.keys(req.query.sort).map((key) => [
//           key,
//           req.query.sort[key],
//         ]);
//       }

//       const options = {
//         page: req.query.page || 1,
//         limit: req.query.limit || 100,
//         collation: {
//           locale: "en",
//         },
//       };

//       let filteredQuery: any = {
//         is_delete: false,
//         country_id: new mongoose.Types.ObjectId(req.country_id)
//       };
//       if (req.query.search && req.query.search.trim()) {
//         filteredQuery.$or = [
//           {
//             name: {
//               $regex: new RegExp(req.query.search),
//               $options: "i",
//             },
//           },
//         ];
//       }

//       if (req.params.type && req.params.type.trim()) {
//         filteredQuery.type = req.params.type;
//       }

//       if (req.query.status) {
//         var arrayValues = req.query.status.split(",");
//         var booleanValues = arrayValues.map(function (value) {
//           return value.toLowerCase() === "true";
//         });
//         filteredQuery.is_active = { $in: booleanValues };
//       }

//       let query: any = [
//         {
//           $match: filteredQuery,
//         },
//         {
//           $sort: {
//             created_at: -1,
//           },
//         },
//       ];

//       var myAggregate = Category.aggregate(query);



//       let list = await Category.aggregatePaginate(myAggregate, options);

//       const sdata = await Promise.all(list.docs.map(async (item) => {
//         const haveItem = await SubCategory.findOne({ category_id: item._id, country_id: req.country_id, is_delete: false })
//         return ({
//           ...item,
//           have_item: haveItem ? true : false
//         })
//       }))

//       const adata = await Promise.all(sdata.map(async (item) => {
//         const haveActiveItem = await SubCategory.findOne({ category_id: item._id, country_id: req.country_id, is_delete: false, is_active: true })
//         return ({
//           ...item,
//           have_active_item: haveActiveItem ? true : false
//         })
//       }))

//       list = { ...list, docs: adata }

//       return _RS.ok(res, "SUCCESS", "List", { list: list }, startTime);
//     } catch (err) {
//       next(err);
//     }
//   }

//   static async add(req, res, next) {
//     try {
//       const startTime = new Date().getTime();
//       const { image, name, ar_name, is_active, country_id, is_featured, is_request_quote, view } = req.body;

//       const categoryData = await Category.findOne({ name: name, country_id: country_id });

//       if (categoryData) {
//         return _RS.conflict(
//           res,
//           "COFLICT",
//           "Category already exist with this name",
//           categoryData,
//           startTime,
//         );
//       }

//       const category = await new Category({
//         name: name,
//         ar_name: ar_name,
//         added_by: "Admin",
//         image: image ? image : null,
//         is_active,
//         country_id,
//         is_featured,
//         is_request_quote,
//         view
//       }).save();

//       return _RS.created(
//         res,
//         "SUCCESS",
//         "Category has been added successfully",
//         category,
//       );
//     } catch (err) {
//       next(err);
//     }
//   }

//   static async edit(req, res, next) {
//     try {
//       const startTime = new Date().getTime();
//       const { image, name, ar_name, is_active, country_id, is_featured, is_request_quote, view } = req.body;
//       const id = req.params.id;

//       const getCategory = await Category.findById(id);

//       if (!getCategory) {
//         return _RS.notFound(
//           res,
//           "NOTFOUND",
//           "Category Not Found",
//           {},
//           startTime,
//         );
//       }

//       getCategory.name = name ? name : getCategory.name
//       getCategory.ar_name = ar_name ? ar_name : getCategory.ar_name
//       getCategory.image = image ? image : getCategory.image
//       getCategory.country_id = country_id ? country_id : getCategory.country_id
//       getCategory.view = view ? view : getCategory.view
//       getCategory.is_active = is_active
//       getCategory.is_featured = is_featured
//       getCategory.is_request_quote = is_request_quote
//       getCategory.save()

//       return _RS.ok(
//         res,
//         "SUCCESS",
//         "Category has been update successfully",
//         getCategory,
//         startTime,
//       );
//     } catch (err) {
//       next(err);
//     }
//   }

//   static async statusChange(req, res, next) {
//     try {
//       const startTime = new Date().getTime();

//       const getCategory = await Category.findOne({ _id: req.params.id });

//       if (!getCategory) {
//         return _RS.notFound(
//           res,
//           "NOTFOUND",
//           "Category not found",
//           getCategory,
//           startTime,
//         );
//       }

//       getCategory.is_active = !getCategory.is_active
//       await getCategory.save();

//       return _RS.ok(
//         res,
//         "SUCCESS",
//         "Category Status changed successfully",
//         getCategory,
//         startTime,
//       );
//     } catch (err) {
//       next(err);
//     }
//   }

//   static async deleteCategory(req, res, next) {
//     try {
//       const startTime = new Date().getTime();

//       const getCategory = await Category.findOne({ _id: req.params.id });

//       if (!getCategory) {
//         return _RS.notFound(
//           res,
//           "NOTFOUND",
//           "Category not found",
//           getCategory,
//           startTime,
//         );
//       }


//       getCategory.is_delete = true
//       await getCategory.save();
//       // await getCategory.remove();

//       return _RS.ok(
//         res,
//         "SUCCESS",
//         "Category deleted successfully",
//         getCategory,
//         startTime,
//       );
//     } catch (err) {
//       next(err);
//     }
//   }

//   static async deleteAll(req, res, next) {
//     try {
//       const startTime = new Date().getTime();

//       const ids = req.body.ids



//       const haveItem = await SubCategory.findOne({ category_id: { $in: ids }, country_id: req.country_id, is_delete: false })
//       console.log("haveItem", haveItem)
//       if (haveItem) {
//         return _RS.badRequest(
//           res,
//           "NOTFOUND",
//           "This category contains Sub-Category, please remove  this sub category from sub category before deleting category",
//           {},
//           startTime,
//         );
//       }

//       const getCategory = await Category.updateMany({ _id: { $in: ids } }, { $set: { is_delete: true } });


//       if (!getCategory) {
//         return _RS.notFound(
//           res,
//           "NOTFOUND",
//           "Category not found",
//           getCategory,
//           startTime,
//         );
//       }

//       return _RS.ok(
//         res,
//         "SUCCESS",
//         "category's deleted successfully",
//         getCategory,
//         startTime,
//       );
//     } catch (err) {
//       next(err);
//     }
//   }

//   static async importFile(req, res, next) {
//     try {
//       const startTime = new Date().getTime();
//       const { import_file } = req.body;
//       const saveCategory = import_file.map(async (item, index) => {
//         await Category.create({
//           image: item.image,
//           type: req.params.type,
//           name: item.name.trim().toLowerCase(),
//           status:
//             item.status == "Active" || item.status == "active" ? true : false,
//           added_by: "Excel",
//         });
//       });
//       return _RS.ok(
//         res,
//         "SUCCESS",
//         "Import category successfully",
//         saveCategory,
//         startTime,
//       );
//     } catch (err) {
//       next(err);
//     }
//   }
// }
