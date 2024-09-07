import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import _RS from "../../helpers/ResponseHelper";
import * as mongoose from "mongoose";
import Helper from "../../helpers/Helper";
import Role, { ApproveStatus, UserTypes } from "../../models/Role";
import MailHelper from "../../helpers/MailHelper";
import EmailTemplate from "../../models/EmailTemplate";
import Auth from '../../Utils/Auth'
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import ServiceCity from "../../models/ServiceCity";
import { activityLog, changeLog } from "../../helpers/function";
import { Action } from "../../models/ActivityLog";
import Provider from "../../models/Provider";
import User from "../../models/User";
import { ChangeLogAction } from "../../models/ChangeLog";

const collationOptions = {
    locale: "en",
    strength: 2,
};

class RoleRouter {
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
            checkPermission(Permissions.Role),
            [
                body('name').notEmpty().withMessage('Valid name must be provided'),
                body('permission').notEmpty().isArray().withMessage('Valid permissions must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    let { name, permission, country_id } = req.body;
                    const userType = UserTypes.SUB_ADMIN
                    name = name ? name.trim() : name
                    const nameRegex = new RegExp(`^${name}$`, 'i');
                    let isSubAdminExists = await Role.findOne({  name: { $regex: nameRegex } });

                    if (isSubAdminExists?.is_delete) {
                        await Role.deleteOne({  name: { $regex: nameRegex } , type: userType })
                    }

                    if (isSubAdminExists && !isSubAdminExists?.is_delete) {
                        return _RS.apiNew(res, false, "Role already used", {}, startTime);
                    }
                    const user = await Role.create({ name, permission, country_id, type: userType, })

                    if (req.user.type == UserTypes.SUB_ADMIN) {
                        await changeLog(ChangeLogAction.ADD, `Added New SubAdmin Role ${user?.name}.`, req.user.id);
                      }


                    return _RS.apiNew(res, true, "Role added successfully", { data: user }, startTime);
                } catch (error) {
                    console.log("Error:", error);
                    next(error);
                }
            }
        );

        this.router.put("/:id",
            Authentication.admin,
            checkPermission(Permissions.Role),
            [
                body('name').notEmpty().withMessage('Valid name must be provided'),
                body('permission').notEmpty().isArray().withMessage('Valid permissions must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id

                    const user = await Role.findById(id)

                    if (!user) {
                        return _RS.apiNew(res, false, "Role not found", {}, startTime);
                    }

                    let { name, mobile_number, country_code, country_id, title, city_id, city, email, permission, is_collector } = req.body;
                    name = name ? name.trim() : name
                    const nameRegex = new RegExp(`^${name}$`, 'i');

                    let isAlready = await Role.findOne({ name: { $regex: nameRegex }, _id: { $ne: id }, type: UserTypes.SUB_ADMIN })
                      console.log("isAlready",isAlready)  
                    if (isAlready?.is_delete) {
                        await Role.deleteOne({ name: { $regex: nameRegex },  _id: { $ne: id }, type: UserTypes.SUB_ADMIN })
                    }

                    if (isAlready && !isAlready?.is_delete) {
                        return _RS.apiNew(res, false, "Role already used", {}, startTime);
                    }

                    user.name = name ? name : user.name
                    user.country_id = country_id ? country_id : user.country_id
                    user.permission = permission ? permission : user.permission


                    await user.save()
                    if (req.user.type == UserTypes.SUB_ADMIN) {
                        await changeLog(ChangeLogAction.UPDATE, `Updated SubAdmin Role ${user?.name}.`, req.user.id);
                      }
                    return _RS.apiNew(
                        res,
                        true,
                        "Role updated successfully",
                        user,
                        startTime
                    );
                } catch (error) {
                    console.log("Error :", error);

                    next(error);
                }
            }
        );

        this.router.put("/:id/status",
            Authentication.admin,
            checkPermission(Permissions.Role),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id

                    const user = await Role.findById(id)

                    if (!user) {
                        return _RS.apiNew(res, false, "Role not found", {}, startTime);
                    }

                    const { message } = req.body
                    if (user.is_active) activityLog(Action.BLOCK, message, user._id)
                    else activityLog(Action.UNBLOCK, message, user._id)


                    user.is_active = !user.is_active

                    await user.save()
                    if (req.user.type == UserTypes.SUB_ADMIN) {
                        await changeLog(ChangeLogAction.STATUS, `Changed Status SubAdmin Role ${user?.name}.`, req.user.id);
                      }
                    return _RS.apiNew(
                        res,
                        true,
                        "Role status changed successfully",
                        user,
                        startTime
                    );
                } catch (error) {
                    console.log("Error :", error);

                    next(error);
                }
            }
        );

        this.router.delete("/:id",
            Authentication.admin,
            checkPermission(Permissions.Role),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id

                    const user = await Role.findById(id)

                    if (!user) {
                        return _RS.apiNew(res, false, "Role not found", {}, startTime);
                    }

                    user.is_delete = true

                    await user.save()
                    if (req.user.type == UserTypes.SUB_ADMIN) {
                        await changeLog(ChangeLogAction.DELETE, `Deleted SubAdmin Role ${user?.name}.`, req.user.id);
                      }
                    return _RS.apiNew(
                        res,
                        true,
                        "Role deleted successfully",
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

        this.router.get("/",
            Authentication.admin,
            checkPermission(Permissions.Role),
            [
                query('page').notEmpty().withMessage('Valid page number must be provided'),
                query('pageSize').notEmpty().withMessage('Valid page number must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    let sort: any = { created_at: -1 };

                    let page = 1;
                    let pageSize = 100;

                    const filter: any = { is_delete: false, type: UserTypes.SUB_ADMIN, ...req.filter } //is_collector: false

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
                    if (req.query.name) sort = { name: req.query.name == "ascend" ? 1 : -1 };
                    if (req.query.page) page = parseInt(req.query.page);
                    if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

                    let year = new Date().getFullYear();
                    // if (req.country_id) filter.country_id = new mongoose.Types.ObjectId(req.country_id);
                    // if (req.query.city_id) filter.city_ids = { $in: [new mongoose.Types.ObjectId(req.query.city_id)] };

                    if (req.query.year) {
                        year = parseInt(req.query.year)
                        const startOfYear = new Date(year, 0, 1);
                        const endOfYear = new Date(year + 1, 0, 1);
                        filter.created_at = {
                            $gte: startOfYear,
                            $lt: endOfYear,
                        }
                    };

                    if (req.query.month) {
                        const month = parseInt(req.query.month)
                        const startOfMonth = new Date(year, month - 1, 1);
                        const endOfMonth = new Date(year, month, 1);
                        filter.created_at = {
                            $gte: startOfMonth,
                            $lt: endOfMonth,
                        }
                    }

                    if (req.query.role) {

                        filter.permission = {
                            $in: [req.query.role]
                        }
                    }
                    const skipDocuments = (page - 1) * pageSize;
                    let total = await Role.countDocuments(filter)

                    const pipeline: any = [
                        { $match: filter },
                        {
                            $lookup: {
                                from: "servicecountries",
                                localField: "country_id",
                                foreignField: "_id",
                                as: "country_id",
                            },
                        },
                        {
                            $unwind: {
                                path: "$country_id",
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

                    ]

                    let data = await Role.aggregate(pipeline).collation(collationOptions)

                    const sdata = await Promise.all(data.map(async (item) => {
                        const haveItem = await User.findOne({ type: UserTypes.SUB_ADMIN, role_id: item._id, country_id: req.country_id, is_delete: false })
                        return ({
                            ...item,
                            have_item: haveItem ? true : false
                        })
                    }))
                    const adata = await Promise.all(sdata.map(async (item) => {
                        const haveActiveItem = await User.findOne({ type: UserTypes.SUB_ADMIN, role_id: item._id, country_id: req.country_id, is_delete: false, is_active: true })
                        return ({
                            ...item,
                            have_active_item: haveActiveItem ? true : false
                        })
                    }))



                    return _RS.apiNew(
                        res,
                        true,
                        "Role list  get successfully",
                        {
                            data: adata,
                            total,
                            page,
                            pageSize
                        },
                        startTime
                    );
                } catch (error) {
                    console.log("Error :", error);

                    next(error);
                }
            }
        );

        this.router.get("/filters",
            Authentication.admin,
            checkPermission(Permissions.Role),
            [

            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    const filter: any = { is_delete: false, type: UserTypes.SUB_ADMIN, ...req.filter }

                    if (req.country_id) filter.country_id = req.country_id

                    const data = await Role.find({ ...filter }).select('city_id country_id  city_ids created_at permission')

                    const cityIds = [...new Set(data.reduce((acc, { city_ids }) => {
                        acc.push(...city_ids);
                        return acc;
                    }, []))];

                    // const permission = [...new Set(data.map(({ permission }: any) => permission))]
                    const permission = [...new Set(data.reduce((acc, { permission }) => {
                        acc.push(...permission);
                        return acc;
                    }, []))];

                    const [year, city] = await Promise.all([
                        Helper.getYearAndMonth(data),
                        ServiceCity.find({ _id: { $in: cityIds } })
                    ])

                    return _RS.apiNew(
                        res,
                        true,
                        "Filter list  get successfully",
                        {
                            data: city,
                            ...year,
                            permission
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

export default new RoleRouter().router;
