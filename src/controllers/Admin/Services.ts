// import * as mongoose from "mongoose";

// import _RS from "../../helpers/ResponseHelper";
// import Service from "../../models/Serivces";
// import Restaurant from "../../models/Provider";

// export class ServicesController {
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
//           $lookup: {
//             from: "categories",
//             localField: "category_id",
//             foreignField: "_id",
//             as: "category_id"
//           }
//         },
//         {
//           $lookup: {
//             from: "subcategories",
//             localField: "sub_category_id",
//             foreignField: "_id",
//             as: "sub_category_id"
//           }
//         },
//         {
//           $unwind: {
//             path: "$category_id",
//             preserveNullAndEmptyArrays: true
//           },
//         },
//         {
//           $unwind: {
//             path: "$sub_category_id",
//             preserveNullAndEmptyArrays: true
//           },
//         },
//         {
//           $sort: {
//             created_at: -1,
//           },
//         },
//       ];

//       var myAggregate = Service.aggregate(query);



//       let list = await Service.aggregatePaginate(myAggregate, options);

//       const sdata = await Promise.all(list.docs.map(async (item) => {
//         const haveItem = await Restaurant.findOne({ category_id: { $elemMatch: { $in: [item._id] } }, country_id: req.country_id, is_delete: false })
//         return ({
//           ...item,
//           have_item: haveItem ? true : false
//         })
//       }))

//       const adata = await Promise.all(sdata.map(async (item) => {
//         const haveActiveItem = await Restaurant.findOne({ category_id: { $elemMatch: { $in: [item._id] } }, country_id: req.country_id, is_delete: false, is_active: true })
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
//       const { image, name, ar_name, is_active, country_id, category_id, sub_category_id } = req.body;

//       const serviceData = await Service.findOne({ name: name, country_id: country_id });

//       if (serviceData) {
//         return _RS.conflict(
//           res,
//           "COFLICT",
//           "Service already exist with this name",
//           serviceData,
//           startTime,
//         );
//       }

//       const service = await new Service({
//         name: name,
//         ar_name: ar_name,
//         added_by: "Admin",
//         image: image ? image : null,
//         is_active,
//         country_id,
//         category_id,
//         sub_category_id
//       }).save();

//       return _RS.created(
//         res,
//         "SUCCESS",
//         "Service has been added successfully",
//         service,
//       );
//     } catch (err) {
//       next(err);
//     }
//   }

//   static async edit(req, res, next) {
//     try {
//       const startTime = new Date().getTime();
//       const { image, name, ar_name, is_active, country_id, category_id, sub_category_id } = req.body;
//       const id = req.params.id;

//       const getService = await Service.findById(id);

//       if (!getService) {
//         return _RS.notFound(
//           res,
//           "NOTFOUND",
//           "Service Not Found",
//           {},
//           startTime,
//         );
//       }

//       getService.name = name ? name : getService.name
//       getService.ar_name = ar_name ? ar_name : getService.ar_name
//       getService.category_id = category_id ? category_id : getService.category_id
//       getService.sub_category_id = sub_category_id ? sub_category_id : getService.sub_category_id
//       getService.image = image ? image : getService.image
//       getService.country_id = country_id ? country_id : getService.country_id
//       getService.is_active = is_active
//       getService.save()

//       return _RS.ok(
//         res,
//         "SUCCESS",
//         "Service has been update successfully",
//         getService,
//         startTime,
//       );
//     } catch (err) {
//       next(err);
//     }
//   }

//   static async statusChange(req, res, next) {
//     try {
//       const startTime = new Date().getTime();

//       const getService = await Service.findOne({ _id: req.params.id });

//       if (!getService) {
//         return _RS.notFound(
//           res,
//           "NOTFOUND",
//           "Service not found",
//           getService,
//           startTime,
//         );
//       }

//       getService.is_active = !getService.is_active
//       await getService.save();

//       return _RS.ok(
//         res,
//         "SUCCESS",
//         "Service  Status changed successfully",
//         getService,
//         startTime,
//       );
//     } catch (err) {
//       next(err);
//     }
//   }

//   static async deleteCategory(req, res, next) {
//     try {
//       const startTime = new Date().getTime();

//       const getService = await Service.findOne({ _id: req.params.id });

//       if (!getService) {
//         return _RS.notFound(
//           res,
//           "NOTFOUND",
//           "Service  not found",
//           getService,
//           startTime,
//         );
//       }


//       getService.is_delete = true
//       await getService.save();
//       // await getService.remove();

//       return _RS.ok(
//         res,
//         "SUCCESS",
//         "Service deleted successfully",
//         getService,
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

//       const getService = await Service.updateMany({ _id: { $in: ids } }, { $set: { is_delete: true } });


//       if (!getService) {
//         return _RS.notFound(
//           res,
//           "NOTFOUND",
//           "Service not found",
//           getService,
//           startTime,
//         );
//       }

//       return _RS.ok(
//         res,
//         "SUCCESS",
//         "Service's deleted successfully",
//         getService,
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
//       const saveService = import_file.map(async (item, index) => {
//         await Service.create({
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
//         "Import Service  successfully",
//         saveService,
//         startTime,
//       );
//     } catch (err) {
//       next(err);
//     }
//   }
// }
