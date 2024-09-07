import * as mongoose from "mongoose";

import _RS from "../../helpers/ResponseHelper";
import EventType from "../../models/EventType";
import Restaurant from "../../models/Provider";
import Category from "../../models/Category";
import Provider from "../../models/Provider";
import { ChangeLogAction } from "../../models/ChangeLog";
import { changeLog } from "../../helpers/function";
import { UserTypes } from "../../models/User";

export class EventTypeController {
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
          $match: filteredQuery,
        },
        {
          $sort: {
            created_at: -1,
          },
        },
      ];

      var myAggregate = EventType.aggregate(query);

      let list = await EventType.aggregatePaginate(myAggregate, options);

      const sdata = await Promise.all(
        list.docs.map(async (item) => {
          const haveItem = await Provider.findOne({
            vendor_id: item._id,
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
          const haveActiveItem = await Provider.findOne({
            vendor_id: item._id,
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
      let {
        image,
        name,
        ar_name,
        is_active,
        country_id,
        is_featured,
        service_id,
      } = req.body;
      name = name ? name.trim() : name;
      const nameRegex = new RegExp(`^${name}$`, "i");
      const eventType = await EventType.findOne({
        name: { $regex: nameRegex },
        country_id: country_id,
        is_delete: false,
      });

      if (eventType) {
        return _RS.conflict(
          res,
          "COFLICT",
          "Event Type already exist with this name",
          eventType,
          startTime
        );
      }

      const event = await EventType.create({
        name: name,
        ar_name: ar_name,
        added_by: "Admin",
        image: image ? image : null,
        is_active,
        country_id,
        is_featured,
        service_id,
      });

      if (req.user.type == UserTypes.TEACHER) {
        await changeLog(
          ChangeLogAction.ADD,
          `Added New Event ${event?.name}.`,
          req.user.id
        );
      }
      return _RS.created(
        res,
        "SUCCESS",
        "Event Type has been added successfully",
        event
      );
    } catch (err) {
      next(err);
    }
  }

  static async edit(req, res, next) {
    try {
      const startTime = new Date().getTime();
      let {
        image,
        name,
        ar_name,
        is_active,
        country_id,
        is_featured,
        service_id,
      } = req.body;
      const id = req.params.id;

      const eventType = await EventType.findById(id);

      if (!eventType) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Event Type Not Found",
          {},
          startTime
        );
      }

      name = name ? name.trim() : name;
      const nameRegex = new RegExp(`^${name}$`, "i");

      let isAlready = await EventType.findOne({
        name: { $regex: nameRegex },
        _id: { $ne: id },
      });

      if (isAlready?.is_delete) {
        await EventType.deleteOne({
          name: { $regex: nameRegex },
          _id: { $ne: id },
        });
      }

      if (isAlready && !isAlready?.is_delete) {
        return _RS.apiNew(
          res,
          false,
          "Event already used this name",
          {},
          startTime
        );
      }

      eventType.name = name ? name : eventType.name;
      eventType.ar_name = ar_name ? ar_name : eventType.ar_name;
      eventType.image = image ? image : eventType.image;
      eventType.service_id = service_id ? service_id : eventType.service_id;
      eventType.country_id = country_id ? country_id : eventType.country_id;
      eventType.is_active = is_active;
      eventType.is_featured = is_featured;
      eventType.save();

      if (req.user.type == UserTypes.TEACHER) {
        await changeLog(
          ChangeLogAction.UPDATE,
          `Updated Banner ${eventType.name}.`,
          req.user.id
        );
      }

      return _RS.ok(
        res,
        "SUCCESS",
        "Event Type has been update successfully",
        eventType,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async statusChange(req, res, next) {
    try {
      const startTime = new Date().getTime();

      const eventType = await EventType.findOne({ _id: req.params.id });

      if (!eventType) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Event Type not found",
          eventType,
          startTime
        );
      }

      eventType.is_active = !eventType.is_active;
      await eventType.save();

      if (req.user.type == UserTypes.TEACHER) {
        await changeLog(
          ChangeLogAction.STATUS,
          `Changed Status Svent ${eventType?.name}.`,
          req.user.id
        );
      }
      return _RS.ok(
        res,
        "SUCCESS",
        "Event Type Status changed successfully",
        eventType,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async deleteEvent(req, res, next) {
    try {
      const startTime = new Date().getTime();

      const eventType = await EventType.findOne({ _id: req.params.id });

      if (!eventType) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Event Type not found",
          eventType,
          startTime
        );
      }

      eventType.is_delete = true;
      await eventType.save();
      // await eventType.remove();

      if (req.user.type == UserTypes.TEACHER) {
        await changeLog(
          ChangeLogAction.DELETE,
          `Deleted Event ${eventType?.name}.`,
          req.user.id
        );
      }
      return _RS.ok(
        res,
        "SUCCESS",
        "Event Type deleted successfully",
        eventType,
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

      const eventType = await EventType.updateMany(
        { _id: { $in: ids } },
        { $set: { is_delete: true } }
      );

      if (!eventType) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Event Type  not found",
          eventType,
          startTime
        );
      }

      return _RS.ok(
        res,
        "SUCCESS",
        "Event Type's deleted successfully",
        eventType,
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
      const saveEventType = import_file.map(async (item, index) => {
        await EventType.create({
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
        "Import Event Type successfully",
        saveEventType,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }
}
