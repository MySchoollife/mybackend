import * as mongoose from "mongoose";
import _RS from "../../helpers/ResponseHelper";
import User, { UserTypes } from "../../models/User";
import moment = require("moment");
import Service from "../../models/Serivces";
import Banner from "../../models/Banner";

export class DashboardController {
  static async dashboardData(req, res, next) {
    try {
      const startTime = new Date().getTime();

      const year = req.query.year;
      let startDate, endDate;
      const currentDate = new Date();
      const sevenDaysAgo = moment(currentDate).subtract(7, "days").toDate();
      const previousSevenDaysAgo = moment(sevenDaysAgo)
        .subtract(7, "days")
        .toDate();

      if (year) {
        startDate = moment(`${year}-01-01`, "YYYY-MM-DD");
        endDate = moment(`${year}-12-31`, "YYYY-MM-DD");
      } else {
        const currentYear = moment().year();
        startDate = moment(`${currentYear}-01-01`, "YYYY-MM-DD");
        endDate = moment(`${currentYear}-12-31`, "YYYY-MM-DD");
      }

      const date1 = { created_at: { $gte: startDate, $lte: endDate } };
      const filter: any = { ...date1 };

      const pipeline = [
        {
          $match: {
            is_delete: false,
            ...filter,
          },
        },
        // {
        //   $limit: 5,
        // },
      ];

      const [
        totalCustomer,
        activeCustomer,
        totalServiceProvider,
        totalEventType,
        totalServices,
        totalCategories,
        banner,
        topProvider,
        reportedProvider,
        viewProvider,
        topCategory,
        viewServices,
        servicePerCategory,
      ] = await Promise.all([
        User.countDocuments({
          type: UserTypes.TEACHER,
          is_delete: false,
          ...filter,
        }),
        User.countDocuments({
          type: UserTypes.TEACHER,
          is_active: true,
          is_delete: false,
          ...filter,
        }),
        Banner.countDocuments({ is_delete: false, ...filter }),
        Banner.countDocuments({ is_delete: false, ...filter }),
        Service.countDocuments({ is_delete: false, ...filter }),
        Banner.countDocuments({ is_delete: false, ...filter }),
        Banner.find({ is_delete: false }).limit(5).sort({ created_at: -1 }),
        Banner.find({ is_delete: false }).limit(5).sort({ created_at: -1 }),
        Banner.find({ is_delete: false }).limit(5).sort({ created_at: -1 }),
        Banner.find({ is_delete: false }).limit(5).sort({ created_at: -1 }),
        Banner.find({ is_delete: false }).limit(5).sort({ created_at: -1 }),
        Banner.find({ is_delete: false })
          .limit(5)
          .sort({ created_at: -1 })
          .populate({ path: "category_id" }),
        Banner.find({ is_delete: false }).limit(5).sort({ created_at: -1 }),
      ]);

      // const banner = await Banner.find({}).limit(5);

      let data = {
        totalCustomer,
        activeCustomer,
        totalServiceProvider,
        totalEventType,
        totalServices,
        totalCategories,
        banner,
        topProvider,
        reportedProvider,
        viewProvider,
        topCategory,
        viewServices,
        servicePerCategory,
      };

      return _RS.ok(
        res,
        "SUCCESS",
        "Dashboard dataa has been get Successfully",
        data,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }
}
