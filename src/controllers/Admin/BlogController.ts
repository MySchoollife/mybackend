import Blog from "../../models/Blog";
import _RS from "../../helpers/ResponseHelper";
var slug = require('slug');

export class BlogController {
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
      var myAggregate = Blog.aggregate(query);
      const list = await Blog.aggregatePaginate(myAggregate, options);
      return _RS.ok(res, "SUCCESS", "List", { list: list }, startTime);
    } catch (err) {
      next(err);
    }
  }

  static async addEdit(req, res, next) {
    try {
      const startTime   =   new Date().getTime();
      const { thumbnail,title,es_title,de_title,fr_title, description, es_description, fr_description, de_description } = req.body;


      const getBlog   =   await Blog.findOne({ _id: req.params.id });

      if (!getBlog) {
        const blogData = await Blog.findOne({ title : title });
    
        if (blogData){
          return _RS.conflict(res, "COFLICT", "Blog already exist with this title", blogData, startTime);
        }
    
        const data = {
          title           :   title,
          es_title        :   es_title,
          de_title        :   de_title,
          fr_title        :   fr_title,
          thumbnail       :   thumbnail,
          description     :   description,
          es_description  :   es_description,
          fr_description  :   fr_description,
          de_description  :   de_description,
          slug            :   slug(title, {lower: true})
        };
    
        const user    =   await new Blog(data).save();
        return _RS.created(res, "SUCCESS", "Blog has been added successfully", user);
      }

      getBlog.title           =  title ? title : getBlog.title,
      getBlog.es_title        =  es_title ? es_title : getBlog.es_title,
      getBlog.de_title        =  de_title ? de_title : getBlog.de_title,
      getBlog.fr_title        =  fr_title ? fr_title : getBlog.fr_title,
      getBlog.thumbnail       =  thumbnail ? thumbnail : getBlog.thumbnail,
      getBlog.description     =  description ? description : getBlog.description,
      getBlog.es_description  =  es_description ? es_description : getBlog.es_description,
      getBlog.fr_description  =  fr_description ? fr_description : getBlog.fr_description,
      getBlog.de_description  =  de_description ? de_description : getBlog.de_description,
      getBlog.save();

      return _RS.ok(res, "SUCCESS", "Blog has been update successfully", getBlog, startTime);

    } catch (err) {
      next(err);
    }
  }

  static async statusChange(req, res, next) {
    try {
      const startTime   =   new Date().getTime();
      
      const getBlog     =   await Blog.findById(req.params.id);
      if (!getBlog){
        return _RS.notFound(res, "NOTFOUND", "Blog not found", getBlog, startTime);
      }

      (getBlog.is_active = !getBlog.is_active), getBlog.save();

      return _RS.ok(res, "SUCCESS", "Status changed successfully", getBlog, startTime);
    } catch (err) {
      next(err);
    }
  }

  static async view(req, res, next) {
    try {
      const startTime   =   new Date().getTime();
      const getBlog     =   await Blog.findById(req.params.id);

      return _RS.ok(res, "SUCCESS", "Data get successfully", getBlog, startTime);
    } catch (err) {
      next(err);
    }
  }

}
