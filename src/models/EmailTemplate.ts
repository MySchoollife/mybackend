import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const EmailTemplate = new Schema(
  {
    title: {
      type: String,
    },
    slug: {
      type: String,
    },
    subject: {
      type: String,
    },
    description: {
      type: String,
    },
    ar_description: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: true,
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

export default model<any, AggregatePaginateModel<any>>("EmailTemplate", EmailTemplate);
