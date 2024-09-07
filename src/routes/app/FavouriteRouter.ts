import * as mongoose from "mongoose";
import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import Favourite, { favourite_type } from "../../models/Favourite";
import _RS from "../../helpers/ResponseHelper";
import { body, param, query } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";

class FavouriteRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.get();
    this.post();
  }

  public post() {
    this.router.post(
      "/",
      Authentication.user,
      [
        body("type")
          .notEmpty()
          .withMessage("Type must not be empty")
          .isIn(["Provider", "Service"])
          .withMessage('Type must be either "Provider" or "Service"'),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { type, vendor_id, service_id } = req.body;
          const user_id = new mongoose.Types.ObjectId(req.user.id);
          const vendor = new mongoose.Types.ObjectId(vendor_id);
          const service = new mongoose.Types.ObjectId(service_id);

          let isAlready;
          if (type === favourite_type.PROVIDER) {
            isAlready = await Favourite.findOne({
              user_id: user_id,
              vendor_id: vendor,
              type: favourite_type.PROVIDER,
            });
          }

          if (type === favourite_type.SERVICE) {
            isAlready = await Favourite.findOne({
              user_id: user_id,
              service_id: service,
              type: favourite_type.SERVICE,
            });
          }

          if (isAlready) {
             await isAlready.remove();
            return _RS.apiNew(res, true,"Wishlist remove item successfully", {}, startTime);
          }

          const create = await  Favourite.create({
            user_id: user_id,
            vendor_id: vendor_id,
            service_id: service_id,
            type: type,
          });

          return _RS.apiNew(
            res,
            true,
            "Wishlist add item successfully",
            create,
            startTime
          );
        } catch (err) {
          next(err);
        }
      }
    );
  }

  public get() {
    this.router.get(
      "/",
      Authentication.user,
      [],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const user_id = new mongoose.Types.ObjectId(req.user.id);

          const [provider, service] = await Promise.all([
            Favourite.find({ user_id : user_id,  type: favourite_type.PROVIDER }).populate({
              path : "vendor_id"
            }),
            Favourite.find({ user_id : user_id, type: favourite_type.SERVICE }).populate({
              path : "service_id"
            }),
          ]);

       const data = {
         providers : provider.filter(item => item.vendor_id),
         services : service.filter(item => item.service_id)

       }

          return _RS.apiNew(
            res,
            true,
            "wishlist  retrived successfully",
            data,
            startTime
          );
        } catch (err) {
          next(err);
        }
      }
    );
  }
}

export default new FavouriteRouter().router;
