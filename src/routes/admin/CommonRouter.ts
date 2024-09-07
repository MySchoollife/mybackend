import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import _RS from "../../helpers/ResponseHelper";
import * as mongoose from "mongoose";
import User, { UserTypes } from "../../models/User";

const collationOptions = {
  locale: "en",
  strength: 2,
};

class CommonRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.get();
  }

  public get() {
    this.router.get(
      "/sub-admin",
      [],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = {
            is_active: true,
            is_delete: false,
            type: UserTypes.TEACHER,
          };

          let list = await User.find(filter).sort({ created_at: -1 });
          console.log("list-----", list);
          return _RS.api(
            res,
            true,
            "Sub Admin list get successfully",
            list,
            startTime
          );
        } catch (error) {
          next(error);
        }
      }
    );
  }
}

export default new CommonRouter().router;
