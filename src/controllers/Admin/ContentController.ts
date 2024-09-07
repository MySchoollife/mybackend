import Content from "../../models/Content";
import _RS from "../../helpers/ResponseHelper";
var slug = require('slug');

export class ContentController {
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
      var myAggregate = Content.aggregate(query);
      const list = await Content.aggregatePaginate(myAggregate, options);
      return _RS.ok(res, "SUCCESS", "List", { list: list }, startTime);
    } catch (err) {
      next(err);
    }
  }

  static async addEdit(req, res, next) {
    try {
      const startTime   =   new Date().getTime();
      const { description, name,ar_name,de_name,fr_name,de_description, es_description, fr_description, faq, de_faq, es_faq, fr_faq } = req.body;

      const getContent              =   await Content.findOne({ slug : req.params.slug });     

      if(getContent.slug == 'faq'){
        getContent.faq              =   faq ? faq : getContent.faq;
        getContent.de_faq           =   de_faq ? de_faq : getContent.de_faq;
        getContent.es_faq           =   es_faq ? es_faq : getContent.es_faq;
        getContent.fr_faq           =   fr_faq ? fr_faq : getContent.fr_faq;
      }else{
     

        getContent.name             =   name ? name : getContent.name;
        getContent.ar_name          =   ar_name ? ar_name : getContent.ar_name;
        getContent.description      =   description ? description : getContent.description;
        getContent.de_description   =   de_description ? de_description : getContent.de_description;
        getContent.es_description   =   es_description ? es_description : getContent.es_description;
        getContent.fr_description   =   fr_description ? fr_description : getContent.fr_description;
      }

      getContent.save();

      return _RS.ok(res, "SUCCESS", "Content has been update successfully", getContent, startTime);

    } catch (err) {
      next(err);
    }
  }

  static async statusChange(req, res, next) {
    try {
      const startTime   =   new Date().getTime();
      
      const getContent = await Content.findById(req.params.id);
      if (!getContent){
        return _RS.notFound(res, "NOTFOUND", "Content not found", getContent, startTime);
      }

      (getContent.is_active = !getContent.is_active), getContent.save();

      return _RS.ok(res, "SUCCESS", "Status changed successfully", getContent, startTime);
    } catch (err) {
      next(err);
    }
  }

  static async view(req, res, next) {
    try {
      const startTime     =   new Date().getTime();
      
      const getContent    =   await Content.findOne({ slug : req.params.slug });

      return _RS.ok(res, "SUCCESS", "Data get successfully", getContent, startTime);
    } catch (err) {
      next(err);
    }
  }

}
