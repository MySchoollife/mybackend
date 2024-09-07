import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const Content = new Schema(
  {
    name: { type: String },
    ar_name: { type: String },
    slug: { type: String },
    description: { type: String, default: null },
    ar_description: { type: String, default: null },
    is_active: { type: Boolean, default: true },

  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);
mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("Content", Content);
