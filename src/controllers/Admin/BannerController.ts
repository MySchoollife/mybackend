import Banner from "../../models/Banner";
import _RS from "../../helpers/ResponseHelper";

export class BannerController {
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
      let filteredQuery: any = {};
      if (req.query.type) {
        var arrayValues = req.query.type.split(",");
        var booleanValues = arrayValues.map(function (value) {
          return value.toLowerCase();
        });
        filteredQuery.type = { $in: booleanValues };
      }
      if (req.query.status) {
        var arrayValues = req.query.status.split(",");
        var booleanValues = arrayValues.map(function (value) {
          return value.toLowerCase() === "true";
        });
        filteredQuery.is_active = { $in: booleanValues };
      }

      if (req.query.start_date && req.query.end_date) {
        filteredQuery.created_at = {
          $gte: new Date(req.query.start_date + "T00:00:00Z"),
          $lte: new Date(req.query.end_date + "T23:59:59Z"),
        };
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
            as: "category",
          },
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "offer_id",
            foreignField: "_id",
            as: "offer",
          },
        },
        {
          $unwind: {
            path: "$offer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: {
            created_at: -1,
          },
        },
      ];
      var myAggregate = Banner.aggregate(query);
      const list = await Banner.aggregatePaginate(myAggregate, options);
      return _RS.ok(res, "SUCCESS", "List", { list: list }, startTime);
    } catch (err) {
      next(err);
    }
  }

  static async addEdit(req, res, next) {
    try {
      const startTime = new Date().getTime();
      const { image, type, link, category_id, category_type, offer_id } =
        req.body;

      const getBanner = await Banner.findOne({ _id: req.params.id });

      if (!getBanner) {
        const data = {
          category_type: category_type,
          category_id: category_id,
          offer_id: offer_id,
          image: image,
          type: type,
          link: link,
        };

        const banner = await new Banner(data).save();
        return _RS.created(
          res,
          "SUCCESS",
          "Banner has been added successfully",
          banner
        );
      }

      getBanner.type = type ? type : getBanner.type;
      getBanner.image = image ? image : getBanner.image;
      getBanner.link = link;
      getBanner.category_id = category_id;
      getBanner.category_type = category_type;
      getBanner.offer_id = offer_id;
      getBanner.save();

      return _RS.ok(
        res,
        "SUCCESS",
        "Banner has been update successfully",
        getBanner,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  static async statusChange(req, res, next) {
    try {
      const startTime = new Date().getTime();

      const getBanner = await Banner.findOne({ _id: req.params.id });
      if (!getBanner) {
        return _RS.notFound(
          res,
          "NOTFOUND",
          "Banner not found",
          getBanner,
          startTime
        );
      }

      (getBanner.is_active = !getBanner.is_active), getBanner.save();

      return _RS.ok(
        res,
        "SUCCESS",
        "Status changed successfully",
        getBanner,
        startTime
      );
    } catch (err) {
      next(err);
    }
  }
}
