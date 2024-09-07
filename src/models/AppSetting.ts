import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const AppSetting = new Schema(
  {
    app_store_url: { type: String, default: null },
    play_store_url: { type: String, default: null },
    android_version: { type: String, default: null },
    ios_version: { type: String, default: null },
    android_share_content: { type: String, default: null },
    ios_share_content: { type: String, default: null },
    facebook: { type: String, default: null },
    instagram: { type: String, default: null },
    mobile_number: { type: String, default: null },
    country_code: { type: String, default: null },
    email: { type: String, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("AppSetting", AppSetting);
