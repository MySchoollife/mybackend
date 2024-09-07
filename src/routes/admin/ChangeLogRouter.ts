import { Router } from "express";
import { param, query } from "express-validator";
import * as mongoose from "mongoose";

import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import _RS from "../../helpers/ResponseHelper";
import ActivityLog from "../../models/ActivityLog";
import { UserTypes } from "../../models/User";
import ChangeLog from "../../models/ChangeLog";

class ChangeLogRouter {
    public router: Router;
    constructor() {
        this.router = Router();
        this.get();
    }

    public get() {
        this.router.get(
            "/:userId",
            Authentication.admin,
            [
                query('page').optional().notEmpty().withMessage('Valid page number must be provided'),
                param('userId').notEmpty().isMongoId().withMessage('Valid user id  must be provided'),
                query('pageSize').optional().notEmpty().withMessage('Valid page size must be provided'),
            ],
            ValidateRequest,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();
                    const id = req.params.userId
                    let page = 1;
                    let pageSize = 100000;

                    const filter: any = { 
                        user_id: new mongoose.Types.ObjectId(id),
                        // type : UserTypes.SUB_ADMIN 
                    }

                    if (req.query.page) page = parseInt(req.query.page);
                    if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

                    let total = await ChangeLog.countDocuments(filter)

                    const data = await ChangeLog.aggregate([
                        {
                            $match: {
                                ...filter
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'user_id',
                                foreignField: '_id',
                                as: 'user_id'
                            }
                        },
                        {
                            $unwind: {
                                path: '$user_id',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $sort: { created_at: -1 }
                        },
                        {
                            $skip: (page - 1) * pageSize
                        },
                        {
                            $limit: pageSize
                        }
                    ])

                    return _RS.apiNew(res, true, "Change log retrieved successfully", {
                        data,
                        total,
                        page,
                        pageSize
                    }, startTime);

                } catch (error) {
                    console.error("Error:", error);
                    next(error);
                }
            }
        );
    }
}

export default new ChangeLogRouter().router;
