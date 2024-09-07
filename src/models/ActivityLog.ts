import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const Action = {
    BLOCK: "blocked",
    UNBLOCK:'unblocked',
    REJECT: "rejected",
    ACCEPT: "accepted",
    SUSPENDED: "suspended",
    STATUS:'status',
    ACTIVITY:'activity',
    NULL: null,
};

const ActivityLog = new Schema(
    {
        action: { type: String, enum: Object.values(Action), default: null, },
        message: { type: String, default: null },
        user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);
mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("ActivityLog", ActivityLog);
