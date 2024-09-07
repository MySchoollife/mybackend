import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const ApproveStatus = {
  REJECT: "Rejected",
  ACCEPT: "Accepted",
  PENDING: "Pending",
};
const RequestQuote = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    vendor_id : {type : Schema.Types.ObjectId, ref : "Provider", default : null},
    service_id: { type: Schema.Types.ObjectId, ref: "Services", default: null },
    attributes: [{ type: Object, default: [] }],
    comment: { type: String, default: null },
    image: { type: String, default: null },
    price : { type: Number, default: null },
    is_active: { type: Boolean, default: true, },
    is_delete: { type: Boolean, default: false, },
    country_id: { type: Schema.Types.ObjectId, ref: "Country", default: null, },
    approve_status: {
      type: String,
      enum: Object.values(ApproveStatus),
      default: ApproveStatus.PENDING,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("RequestQuote", RequestQuote);
