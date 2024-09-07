import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";

const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const UserSetting = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    enable_all_notifications: { type: Boolean, default: true },
    enable_newsletters: { type: Boolean, default: true },
    offer_notifications_on_email: { type: Boolean, default: false },
    offer_push_notifications: { type: Boolean, default: false },
    offer_whatsapp_notifications: { type: Boolean, default: false }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("UserSetting", UserSetting);