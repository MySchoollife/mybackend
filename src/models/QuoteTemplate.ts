import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const QuoteTemplate = new Schema(
  {
    name: { type: String, default: null },
    ar_name: { type: String, default: null },
    category_id: { type: Schema.Types.ObjectId, ref: "Category", default: null, },
    service_id: { type: Schema.Types.ObjectId, ref: "services", default: null, },
    attribute_id: [{ type: Schema.Types.ObjectId, ref: "Attribute", default: [], }],

    options: [
      {
        name: { type: String, default: null },
        ar_name: { type: String, default: null }
      }
    ],
    type: {
      type: String,
      default: null
    },

    added_by: {
      type: String,
      default: null
    },
    is_required: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
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
QuoteTemplate.index({ name: 'text' });
export default model<any, AggregatePaginateModel<any>>("QuoteTemplate", QuoteTemplate);
