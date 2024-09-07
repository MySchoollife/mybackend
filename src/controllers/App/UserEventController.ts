import * as  mongoose from "mongoose";
import _RS from "../../helpers/ResponseHelper"
import UserEvent from "../../models/UserEvent";
import Serivces from "../../models/Serivces";
import Provider from "../../models/Provider";


export class UserEventController {

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
                limit: req.query.pageSize || 100,
                collation: {
                    locale: "en",
                },
            };

            let filter: any = {
                is_delete: false,
                user_id: new mongoose.Types.ObjectId(req.params.id)
            };

            if (req.query.search && req.query.search.trim()) {
                filter
                    .$or = [
                        {
                            name: {
                                $regex: new RegExp(req.query.search),
                                $options: "i",
                            },
                        },
                    ];
            }

            if (req.query.status) {
                var arrayValues = req.query.status.split(",");
                var booleanValues = arrayValues.map(function (value) {
                    return value.toLowerCase() === "true";
                });
                filter
                    .is_active = { $in: booleanValues };
            }


            let query: any = [
                {
                    $match: filter
                    ,
                },
                {
                    $sort: {
                        created_at: -1,
                    },
                },
            ];

            var myAggregate = UserEvent.aggregate(query);
            let list = await UserEvent.aggregatePaginate(myAggregate, options);

            return _RS.ok(res, "SUCCESS", "User event List retrived successfully", list, startTime);
        } catch (err) {
            next(err);
        }
    }

    static async addEvent(req, res, next) {
        try {
            const startTime = new Date().getTime();
            const { event_id, budget, date, country_id, longitude, latitude } = req.body;
            const userId = req.user.id;

            const event = await new UserEvent({
                event_id, budget, date, country_id, user_id: userId, latitude, longitude,
                location: (longitude && latitude) ? {
                    type: "Point", coordinates: [longitude, latitude],
                } : null,
            }).save();

            return _RS.api(
                res,
                true,
                "Event has been added successfully",
                event,
                startTime
            );
        } catch (err) {
            next(err);
        }
    }

    static async editEvent(req, res, next) {
        try {
            const startTime = new Date().getTime();
            const { event_id, budget, date, country_id, longitude, latitude } = req.body;
            const userId = req.user.id;
            const event = await UserEvent.findOne({ _id: req.params.id })

            if (!event) {
                return _RS.notFound(
                    res,
                    "NOTFOUND",
                    "User event Not Found",
                    {},
                    startTime,
                );
            }

            event.user_id = userId ? userId : event.user_id,
                event.event_id = event_id ? event_id : event.event_id,
                event.budget = budget ? budget : event.budget,
                event.date = date ? date : event.date,
                event.country_id = country_id ? country_id : event.country_id,
                event.latitude = latitude ? latitude : event.latitude,
                event.longitude = longitude ? longitude : event.longitude,
                event.location = (longitude && latitude) ? {
                    type: "Point",
                    coordinates: [longitude, latitude],
                } : event.location

            event.save()

            return _RS.api(
                res,
                true,
                "Event has been updated successfully",
                event,
                startTime
            );
        } catch (err) {
            next(err);
        }
    }

    static async statusChange(req, res, next) {
        try {
            const startTime = new Date().getTime();

            const getData = await UserEvent.findOne({ _id: req.params.id });

            if (!getData) {
                return _RS.notFound(
                    res,
                    "NOTFOUND",
                    "Event not found",
                    getData,
                    startTime,
                );
            }

            getData.is_delete = true
            await getData.save();

            return _RS.ok(
                res,
                "SUCCESS",
                "User Event deleted successfully",
                getData,
                startTime,
            );
        } catch (err) {
            next(err);
        }
    }

    static async addService(req, res, next) {
        try {
            const startTime = new Date().getTime();
            const { event_id, service_id, provider_id } = req.body;
            const userId = req.user.id;

            const event = await UserEvent.findById(event_id);
            if (!event) {
                return _RS.api(res, false, "Event doesn't exists!", {}, startTime);
            }

            const provider = await Provider.findById(provider_id);
            if (!provider) {
                return _RS.api(res, false, "Provider not found!", {}, startTime);
            }

            let service = provider.services?.filter((item) => item?._id == service_id);
            if (service.length === 0) {
                return _RS.api(res, false, "Service not available!", {}, startTime);
            }

            event.services = [...event.services, ...service]
            await event.save();

            return _RS.api(
                res,
                true,
                "Event has been added successfully",
                event,
                startTime
            );
        } catch (err) {
            next(err);
        }
    }


    static async deleteService(req, res, next) {
        try {
            const startTime = new Date().getTime();
            const { event_id, service_id, provider_id } = req.body;
            const userId = req.user.id;

            const event = await UserEvent.findById(event_id);
            if (!event) {
                return _RS.api(res, false, "Event doesn't exists!", {}, startTime);
            }

            const provider = await Provider.findById(provider_id);
            if (!provider) {
                return _RS.api(res, false, "Provider not found!", {}, startTime);
            }

            let service = provider.services?.filter((item) => item?._id == service_id);
            if (service.length === 0) {
                return _RS.api(res, false, "Service not available!", {}, startTime);
            }

            await event.save();

            return _RS.api(
                res,
                true,
                "Event has been updated successfully",
                event,
                startTime
            );
        } catch (err) {
            next(err);
        }
    }
}