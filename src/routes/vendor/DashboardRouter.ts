import { Router } from "express";

import Authentication from "../../Middlewares/Authnetication";
import _RS from "../../helpers/ResponseHelper";
import moment = require("moment");
import * as  mongoose from "mongoose";
import { query } from "express-validator";
import Helper from "../../helpers/Helper";
class VendorDashboardRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
    this.put();
  }

  public post() { }
  public get() {
  



 
  }
  public put() { }
}

export default new VendorDashboardRouter().router;
