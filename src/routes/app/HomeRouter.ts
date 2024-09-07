import { Router } from "express";
import { query } from "express-validator";
import * as mongoose from "mongoose";
import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import _RS from "../../helpers/ResponseHelper";
import Banner, { Position } from "../../models/Banner";
import Category from "../../models/Category";
import Restaurant from "../../models/Provider";
import { ApproveStatus } from "../../models/User";
import AppApiRouter from "./AppApiRouter";
import * as _ from 'lodash'
import UserAddress from "../../models/UserAddress";
import Wishlist from "../../models/Wishlist";
import Helper from "../../helpers/Helper";
import AppSetting from "../../models/AppSetting";
import EventType from "../../models/EventType";

class HomeRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.get();
        this.router.use("/", AppApiRouter)
    }

    public get() {

        this.router.get(
            "/home",
            // Authentication.user,
            [
                query('sort').optional().notEmpty().isIn(['A_Z', 'Z_A']).withMessage('Valid sort must be provided'),
                query('is_rating').optional().notEmpty().isIn([true, false]).withMessage('Valid sort must be provided'),
                query('is_nearest').optional().notEmpty().isIn([true, false]).withMessage('Valid sort must be provided'),
            ],
            ValidateRequest,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();
                    let delivery_type = 'Delivery';
                    // const customer_id = req.user.id;
                    const { sort, is_rating, is_nearest } = req.query
                    const filter: any = { is_delete: false, is_active: true }

                    const [category, event,banner] = await Promise.all([
                        Category.find({ ...filter }).limit(20).sort({ created_at: -1 }).lean(),
                        EventType.find({ ...filter }).limit(20).sort({ created_at: -1 }).lean(),
                        Banner.find({ ...filter }).limit(10).sort({ created_at: -1 }).populate('vendor_id').populate('category_id'),

                    ])


                    return _RS.apiNew(res, true, "Home data retrieved successfully", {
                        category,
                         event,
                         banner
                        
                    }, startTime);

                } catch (error) {
                    console.error("Error:", error);
                    next(error);
                }
            }
        );




    }
}

export default new HomeRouter().router;
