import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const ChangeLogAction = {
    ADD: "add",
    UPDATE:'update',
    DELETE: "delete",
    STATUS:'status',
    NULL: null,
};

const ChangeLog = new Schema(
    {
        action: { type: String, enum: Object.values(ChangeLogAction), default: null, },
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

export default model<any, AggregatePaginateModel<any>>("ChangeLog", ChangeLog);
