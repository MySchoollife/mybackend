import EmailTemplate from "../../models/EmailTemplate";
import _RS from "../../helpers/ResponseHelper";
import { UserTypes } from "../../models/User";
import { ChangeLogAction } from "../../models/ChangeLog";
import { changeLog } from "../../helpers/function";
var slug = require("slug");

export class EmailTemplateController {
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
        limit: req.query.limit || 10,
        collation: {
          locale: "en",
        },
      };
      let filteredQuery: any = { is_active: true };
      if (req.query.search && req.query.search.trim()) {
        filteredQuery.$or = [
          {
            title: {
              $regex: new RegExp(req.query.search),
              $options: "i",
            },
          },
        ];
      }
      if (req.query.start_date && req.query.end_date) {
        filteredQuery.created_at = {
          $gte: new Date(req.query.start_date),
          $lte: new Date(req.query.end_date),
        };
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
      var myAggregate = EmailTemplate.aggregate(query);
      const list = await EmailTemplate.aggregatePaginate(myAggregate, options);
      return _RS.ok(res, "SUCCESS", "List", { list: list }, startTime);
    } catch (err) {
      next(err);
    }
  }

  static async addEdit(req, res, next) {
    try {
      const startTime = new Date().getTime();
      const { title, subject, description, ar_description } = req.body;

      const getEmailTemp = await EmailTemplate.findOne({ _id: req.params.id });

      if (!getEmailTemp) {
        const EmailTempData = await EmailTemplate.findOne({ title: title });

        if (EmailTempData) {
          return _RS.conflict(
            res,
            "COFLICT",
            "Email template already exist with this title",
            EmailTempData,
            startTime
          );
        }

        const data = {
          title: title,
          subject: subject,
          description: description,
          ar_description,
          slug: slug(title, { lower: true }),
        };

        const user = await new EmailTemplate(data).save();
        return _RS.created(
          res,
          "SUCCESS",
          "Email template has been added successfully",
          user
        );
      }

      (getEmailTemp.title = title ? title : getEmailTemp.title),
        (getEmailTemp.subject = subject ? subject : getEmailTemp.subject),
        (getEmailTemp.description = description
          ? description
          : getEmailTemp.description),
        (getEmailTemp.ar_description = ar_description
          ? ar_description
          : getEmailTemp.ar_description),
        getEmailTemp.save();

      if (req.user.type == UserTypes.TEACHER) {
        await changeLog(
          ChangeLogAction.UPDATE,
          `Changed Customer ${getEmailTemp?.name}.`,
          req.user.id
        );
      }
      return _RS.ok(
        res,
        "SUCCESS",
        "Email template has been update successfully",
        getEmailTemp,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async statusChange(req, res, next) {
    try {
      const startTime = new Date().getTime();

      const getEmailTemp = await EmailTemplate.findOne({ _id: req.params.id });
      if (!getEmailTemp) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Email template not found",
          getEmailTemp,
          startTime
        );
      }

      (getEmailTemp.is_active = !getEmailTemp.is_active), getEmailTemp.save();

      return _RS.ok(
        res,
        "SUCCESS",
        "Status changed successfully",
        getEmailTemp,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async view(req, res, next) {
    try {
      const startTime = new Date().getTime();
      const getEmailTemp = await EmailTemplate.findOne({ _id: req.params.id });
      return _RS.ok(
        res,
        "SUCCESS",
        "Data get successfully",
        getEmailTemp,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }
}
