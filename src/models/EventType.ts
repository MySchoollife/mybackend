import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const EventType = new Schema(
  {
    name: { type: String, default: null },
    ar_name: { type: String, default: null },
    image: {
      type: String,
      default: null
    },
    added_by: {
      type: String,
      default: null
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    is_delete: {
      type: Boolean,
      default: false,
    },
    service_id : [{type : Schema.Types.ObjectId, ref : "Service", default : []}],
    country_id: { type: Schema.Types.ObjectId, ref: "Country", default: null, },
    city_id: { type: Schema.Types.ObjectId, ref: "City", default: null, },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

mongoose.plugin(aggregatePaginate);
EventType.index({ name: 'text' });
export default model<any, AggregatePaginateModel<any>>("EventType", EventType);
