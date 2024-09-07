import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const SubCategory = new Schema(
  {
    name: { type: String, default: null },
    ar_name: { type: String, default: null },
    category_id: { type: Schema.Types.ObjectId, ref: "category", default: null, },
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
    is_request_quote: {
      type: Boolean,
      default: false,
    },
    is_delete: {
      type: Boolean,
      default: false,
    },
    country_id: { type: Schema.Types.ObjectId, ref: "Country", default: null, },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

mongoose.plugin(aggregatePaginate);
SubCategory.index({ name: 'text' });
export default model<any, AggregatePaginateModel<any>>("SubCategory", SubCategory);
