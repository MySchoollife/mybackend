import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import _RS from "../../helpers/ResponseHelper";
import * as mongoose from "mongoose";
import Helper from "../../helpers/Helper";
import User, { ApproveStatus, UserTypes } from "../../models/User";
import MailHelper from "../../helpers/MailHelper";
import EmailTemplate from "../../models/EmailTemplate";
import Auth from '../../Utils/Auth'
import Country from "../../models/Country";
import City from "../../models/City";
import ServiceCity from "../../models/ServiceCity";
import ServiceCountry from "../../models/ServiceCountry";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import ServiceArea from "../../models/ServiceArea";

const collationOptions = {
    locale: "en",
    strength: 2,
};

class ServiceLocationRouter {
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
            checkPermission(Permissions.LOCATION),
            [
                body('country_id').notEmpty().withMessage('Valid country  must be provided'),
                body('city_id').optional().notEmpty().isArray().withMessage('Valid cities  must be provided'),
                // body('value').notEmpty().withMessage('Valid value  must be provided'),
                body('ar_name').notEmpty().withMessage('Valid ar_name  must be provided'),
                body('name').notEmpty().withMessage('Valid name must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    const { country_id, city_id, value, ar_name, name } = req.body;

                    let isCodeAlreadyUsed = await ServiceCountry.findOne({ country: country_id });

                    if (isCodeAlreadyUsed) {
                        return _RS.apiNew(res, false, "Country  already Added", {}, startTime);
                    }

                    const country = await Country.findById(country_id).lean()

                    if (!country) {
                        return _RS.apiNew(res, false, "Country Not Found", {}, startTime);
                    }

                    const serviceCountry = await ServiceCountry.create({
                        ...country,
                        country: country._id,
                        value, ar_name, name
                    })

                    const cities = await City.find({ _id: { $in: city_id } }).lean()

                    const city = cities.map(item => {
                        const { _id, ...rest } = item
                        return ({
                            ...item,
                            country: serviceCountry._id,
                            city: _id
                        })
                    })

                    await ServiceCity.insertMany(city);

                    // SMS Sent


                    // End SMS
                    return _RS.apiNew(res, true, "Service location  added successfully", { data: serviceCountry }, startTime);
                } catch (error) {
                    console.log("Error:", error);
                    next(error);
                }
            }
        );

        this.router.post(
            "/:id/area",
            Authentication.admin,
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid city must be provided'),
                body('name').notEmpty().withMessage('Valid name  must be provided'),
                body('ar_name').notEmpty().withMessage('Valid ar_name  must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();
                    const { name, ar_name } = req.body;

                    const city_id = req.params.id

                    const country = await ServiceCity.findById(city_id).lean()

                    if (!country) {
                        return _RS.apiNew(res, false, "City Not Found", {}, startTime);
                    }

                    const al = await ServiceArea.findOne({ name })
                    if (al) {
                        return _RS.apiNew(res, false, "Area name already exist", {}, startTime);
                    }

                    const area = await ServiceArea.create({
                        name, ar_name, city_id
                    });

                    return _RS.apiNew(res, true, "Service area  added successfully", { data: area }, startTime);
                } catch (error) {
                    console.log("Error:", error);
                    next(error);
                }
            }
        );


        this.router.post(
            "/add-city",
            Authentication.admin,
            checkPermission(Permissions.LOCATION),
            [
                body('country_id').notEmpty().withMessage('Valid country  must be provided'),
                body('ar_name').notEmpty().withMessage('Valid ar_name  must be provided'),
                body('name').notEmpty().withMessage('Valid name must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    const { country, state, ar_name, name } = req.body;

                    let isNameAlreadyUsed = await City.findOne({ name: name });

                    if (isNameAlreadyUsed) {
                        return _RS.apiNew(res, false, "City name already Added", {}, startTime);
                    }

                    const addCity = await City.create({
                        name: name,
                        ar_name: ar_name,
                        country: country,
                        state: state
                    })

                    return _RS.apiNew(res, true, "City added successfully", { data: addCity }, startTime);
                } catch (error) {
                    console.log("Error:", error);
                    next(error);
                }
            }
        );

        // this.router.post(
        //     "/add-city",
        //     Authentication.admin,
        //     checkPermission(Permissions.LOCATION),
        //     [
        //         body('name').notEmpty().withMessage('Valid name  must be provided'),
        //         body('country').notEmpty().withMessage('Valid ar_name  must be provided'),

        //     ],
        //     ValidateRequest,
        //     Authentication.userLanguage,
        //     async (req, res, next) => {
        //         try {
        //             const startTime = new Date().getTime();
        //             const { name, country } = req.body; 

        //             const addCity = await City.find({name : name})

        //             if(addCity){
        //                 return _RS.apiNew(res, false, "City  already Added", {}, startTime);

        //             }else{
        //                 return _RS.created(res,"ADD","City add Successfully",addCity)
        //             }


        //             const city_id = addCity._id

        //             const country = await ServiceCity.findById(city_id).lean()

        //             if (!country) {
        //                 return _RS.apiNew(res, false, "City Not Found", {}, startTime);
        //             }

        //             const al = await ServiceArea.findOne({name}) 
        //             if(al){
        //                 return _RS.apiNew(res, false, "Area name already exist", {}, startTime);
        //             }

        //          const area=   await City.create({
        //                 name, ar_name ,city_id
        //             });

        //             return _RS.apiNew(res, true, "Service area  added successfully", { data: area }, startTime);
        //         } catch (error) {
        //             console.log("Error:", error);
        //             next(error);
        //         }
        //     }
        // );


        this.router.put(
            "/:id/area/:areaId",
            Authentication.admin,
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid city must be provided'),
                param('areaId').notEmpty().isMongoId().withMessage('Valid city must be provided'),
                body('name').notEmpty().withMessage('Valid name  must be provided'),
                body('ar_name').notEmpty().withMessage('Valid ar_name  must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();
                    const { name, ar_name } = req.body;

                    const city_id = req.params.id
                    const areaId = req.params.areaId

                    const country = await ServiceCity.findById(city_id).lean()

                    if (!country) {
                        return _RS.apiNew(res, false, "City Not Found", {}, startTime);
                    }

                    const area = await ServiceArea.findById(areaId)

                    if (!area) {
                        return _RS.apiNew(res, false, "Area Not Found", {}, startTime);
                    }

                    const al = await ServiceArea.findOne({ name, _id: { $ne: area._id } })

                    if (al) {
                        return _RS.apiNew(res, false, "Area name already exist", {}, startTime);
                    }

                    area.name = name ? name : area.name
                    area.ar_name = ar_name ? ar_name : area.ar_name

                    await area.save()

                    return _RS.apiNew(res, true, "Service area updated successfully", { data: area }, startTime);

                } catch (error) {
                    console.log("Error:", error);
                    next(error);
                }
            }
        );

        this.router.put("/:id/currency",
            Authentication.admin,
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
                // body('value').notEmpty().withMessage('Valid value  must be provided'),
                body('ar_name').notEmpty().withMessage('Valid ar_name  must be provided'),
                body('name').notEmpty().withMessage('Valid name must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id

                    const serviceCountry = await ServiceCountry.findById(id)

                    if (!serviceCountry) {
                        return _RS.apiNew(res, false, "Country not found", {}, startTime);
                    }

                    const { value, ar_name, name } = req.body;

                    serviceCountry.value = value ? value : serviceCountry.value
                    serviceCountry.ar_name = ar_name ? ar_name : serviceCountry.ar_name
                    serviceCountry.name = name ? name : serviceCountry.name

                    await serviceCountry.save()

                    return _RS.apiNew(
                        res,
                        true,
                        "City updated successfully",
                        serviceCountry,
                        startTime
                    );
                } catch (error) {
                    console.log("Error :", error);

                    next(error);
                }
            }
        );

        // this.router.put("/:id",
        //     Authentication.admin,
        //     checkPermission(Permissions.LOCATION),
        //     [
        //         param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
        //         body('city_id').notEmpty().isArray().withMessage('Valid cities  must be provided'),
        //     ],
        //     ValidateRequest,
        //     Authentication.userLanguage,
        //     async (req, res, next) => {
        //         try {

        //             const startTime = new Date().getTime();

        //             const id = req.params.id

        //             const serviceCountry = await ServiceCountry.findById(id)

        //             if (!serviceCountry) {
        //                 return _RS.apiNew(res, false, "Country not found", {}, startTime);
        //             }

        //             const { city_id } = req.body;

        //             const cities = await City.find({ _id: { $in: city_id } }).lean()

        //             const city = cities.map(item => {
        //                 const { _id, ...rest } = item
        //                 return ({
        //                     ...item,
        //                     country: serviceCountry._id,
        //                 })
        //             })

        //             await ServiceCity.insertMany(city);
        //             return _RS.apiNew(
        //                 res,
        //                 true,
        //                 "City updated successfully",
        //                 serviceCountry,
        //                 startTime
        //             );
        //         } catch (error) {
        //             console.log("Error :", error);

        //             next(error);
        //         }
        //     }
        // );

        this.router.put("/:id",
            Authentication.admin,
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
                body('city_id').notEmpty().isArray().withMessage('Valid cities  must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id

                    const serviceCountry = await ServiceCountry.findById(id)

                    if (!serviceCountry) {
                        return _RS.apiNew(res, false, "Country not found", {}, startTime);
                    }

                    const oneCity = await City.findOne({ country: serviceCountry._id }).sort({ id: 1 }).lean()
                    const { city_id } = req.body;

                    const valid_city_ids = city_id.filter(id => mongoose.Types.ObjectId.isValid(id))
                    const new_cities = city_id.filter(id => !(mongoose.Types.ObjectId.isValid(id)))
                    const cities = await City.find({ _id: { $in: valid_city_ids } }).lean()
                    console.log(new_cities, "new_cities");

                    const city = cities.map(item => {
                        const { _id, ...rest } = item
                        return ({
                            ...item,
                            country: serviceCountry._id,
                        })
                    })

                    await ServiceCity.insertMany(city);

                    const newIds = (await Promise.all(new_cities.map(async (item) => {
                        const is_city = await City.findOne({ name: item }).lean()
                        console.log(JSON.stringify(is_city), "JIK");
                        if (is_city) return null
                        const { _id, ...rest } = oneCity
                        console.log(JSON.stringify({ ...rest, name: item, ar_name: '', id: rest.id + 1 }), "JAJA");
                        const newCity = await City.create({ ...rest, name: item, ar_name: '', id: rest.id + 1 })
                        return newCity._id
                    }))).filter(item => item)

                    console.log(newIds, "newIds");


                    if (newIds.length) {
                        const cities = await City.find({ _id: { $in: newIds } }).lean()
                        const city = cities.map(item => {
                            const { _id, ...rest } = item
                            return ({
                                ...item,
                                country: serviceCountry._id,
                            })
                        })

                        console.log(city, "city_city");

                        await ServiceCity.insertMany(city);
                    }


                    return _RS.apiNew(
                        res,
                        true,
                        "City updated successfully",
                        serviceCountry,
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
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id

                    const user = await ServiceCountry.findById(id)

                    if (!user) {
                        return _RS.apiNew(res, false, "Service Country not found", {}, startTime);
                    }

                    user.is_active = !user.is_active

                    await user.save()

                    return _RS.apiNew(
                        res,
                        true,
                        "Service Country status changed successfully",
                        user,
                        startTime
                    );
                } catch (error) {
                    console.log("Error :", error);

                    next(error);
                }
            }
        );

        this.router.put("/:id/status/:cityId",
            Authentication.admin,
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
                param('cityId').notEmpty().isMongoId().withMessage('Valid cityId must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id
                    const cityId = req.params.cityId

                    const user = await ServiceCountry.findById(id)

                    if (!user) {
                        return _RS.apiNew(res, false, "Service Country not found", {}, startTime);
                    }

                    const city = await ServiceCity.findById(cityId)

                    if (!city) {
                        return _RS.apiNew(res, false, "Service City not found", {}, startTime);
                    }


                    city.is_active = !city.is_active

                    await city.save()

                    return _RS.apiNew(
                        res,
                        true,
                        "Service city status changed successfully",
                        user,
                        startTime
                    );
                } catch (error) {
                    console.log("Error :", error);

                    next(error);
                }
            }
        );

        this.router.put("/:id/area/status/:areaId",
            Authentication.admin,
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
                param('areaId').notEmpty().isMongoId().withMessage('Valid cityId must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id
                    const areaId = req.params.areaId

                    const user = await ServiceCity.findById(id)

                    if (!user) {
                        return _RS.apiNew(res, false, "Service City not found", {}, startTime);
                    }

                    const city = await ServiceArea.findById(areaId)

                    if (!city) {
                        return _RS.apiNew(res, false, "Service Area not found", {}, startTime);
                    }


                    city.is_active = !city.is_active

                    await city.save()

                    return _RS.apiNew(
                        res,
                        true,
                        "Service area status changed successfully",
                        user,
                        startTime
                    );
                } catch (error) {
                    console.log("Error :", error);

                    next(error);
                }
            }
        );

        this.router.put("/:id/action",
            Authentication.admin,
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
                body('status').notEmpty().isIn(Object.values(ApproveStatus)).withMessage('Valid status must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id

                    const user = await User.findById(id)

                    if (!user) {
                        return _RS.apiNew(res, false, "Driver not found", {}, startTime);
                    }

                    user.approve_status = req.body.status

                    await user.save()

                    return _RS.apiNew(
                        res,
                        true,
                        "Driver status changed successfully",
                        user,
                        startTime
                    );
                } catch (error) {
                    console.log("Error :", error);

                    next(error);
                }
            }
        );

        this.router.put("/:id/city",
            Authentication.admin,
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
                // body('value').notEmpty().withMessage('Valid value  must be provided'),
                body('ar_name').notEmpty().withMessage('Valid ar_name  must be provided'),
                body('name').notEmpty().withMessage('Valid name must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id

                    const serviceCountry = await ServiceCity.findById(id)

                    if (!serviceCountry) {
                        return _RS.apiNew(res, false, "City not found", {}, startTime);
                    }

                    const { value, ar_name, name } = req.body;

                    serviceCountry.value = value ? value : serviceCountry.value
                    serviceCountry.ar_name = ar_name ? ar_name : serviceCountry.ar_name
                    serviceCountry.name = name ? name : serviceCountry.name

                    await serviceCountry.save()

                    return _RS.apiNew(
                        res,
                        true,
                        "City updated successfully",
                        serviceCountry,
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
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id

                    const user = await User.findById(id)

                    if (!user) {
                        return _RS.apiNew(res, false, "User not found", {}, startTime);
                    }

                    user.is_delete = true

                    await user.save()

                    return _RS.apiNew(
                        res,
                        true,
                        "Driver deleted successfully",
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
            checkPermission(Permissions.LOCATION),
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

                    const filter: any = {}

                    if (req.query.page) page = parseInt(req.query.page);
                    if (req.query.pageSize) pageSize = parseInt(req.query.pageSize); 

                    

                    const skipDocuments = (page - 1) * pageSize;
                    let total = await ServiceCountry.countDocuments(filter)

                    const pipeline: any = [
                        { $match: filter },
                        {
                            $lookup: {
                                from: "servicecities",
                                localField: "_id",
                                foreignField: "country",
                                as: "cities",
                            },
                        },
                        {
                            $addFields: {
                                city: { $size: "$cities" },
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

                    const data = await ServiceCountry.aggregate(pipeline)

                    return _RS.apiNew(
                        res,
                        true,
                        "Service Country list  get successfully",
                        {
                            data,
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

        this.router.get("/:id",
            Authentication.admin,
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
                query('page').notEmpty().withMessage('Valid page number must be provided'),
                query('pageSize').notEmpty().withMessage('Valid page number must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id
                    let sort: any = { created_at: -1 };

                    let page = 1;
                    let pageSize = 100;

                    const filter: any = { country: new mongoose.Types.ObjectId(id) }

                    if (req.query.page) page = parseInt(req.query.page);
                    if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

                    const skipDocuments = (page - 1) * pageSize;
                    let total = await ServiceCity.countDocuments(filter) 

                    if(req.user.type=='SubAdmin'){
                        filter._id = req.filter.city_id
                    }

                    const pipeline: any = [
                        { $match: filter },
                        {
                            $lookup: {
                                from: "servicecountries",
                                localField: "country",
                                foreignField: "_id",
                                as: "country",
                            },
                        },
                        {
                            $unwind: {
                                path: "$country",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $skip: skipDocuments,
                        },
                        {
                            $limit: pageSize,
                        },
                        { $sort: sort },
                    ]

                    const data = await ServiceCity.aggregate(pipeline)

                    return _RS.apiNew(
                        res,
                        true,
                        "Service country city list  get successfully",
                        {
                            data,
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

        this.router.get("/:id/area",
            Authentication.admin,
            checkPermission(Permissions.LOCATION),
            [
                param('id').notEmpty().isMongoId().withMessage('Valid id must be provided'),
                query('page').notEmpty().withMessage('Valid page number must be provided'),
                query('pageSize').notEmpty().withMessage('Valid page number must be provided'),
            ],
            ValidateRequest,
            Authentication.userLanguage,
            async (req, res, next) => {
                try {

                    const startTime = new Date().getTime();

                    const id = req.params.id
                    let sort: any = { created_at: -1 };

                    let page = 1;
                    let pageSize = 100;

                    const city = await ServiceCity.findById(id)

                    const filter: any = { city_id: new mongoose.Types.ObjectId(id) }

                    if (req.query.page) page = parseInt(req.query.page);
                    if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

                    const skipDocuments = (page - 1) * pageSize;
                    let total = await ServiceArea.countDocuments(filter)

                    const pipeline: any = [
                        { $match: filter },
                        {
                            $lookup: {
                                from: "servicecities",
                                localField: "city_id",
                                foreignField: "_id",
                                as: "city_id",
                            },
                        },
                        {
                            $unwind: {
                                path: "$city_id",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $skip: skipDocuments,
                        },
                        {
                            $limit: pageSize,
                        },
                        { $sort: sort },
                    ]

                    const data = await ServiceArea.aggregate(pipeline)

                    return _RS.apiNew(
                        res,
                        true,
                        "Service city area list  get successfully",
                        {
                            data,
                            city,
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

    }
}

export default new ServiceLocationRouter().router;
