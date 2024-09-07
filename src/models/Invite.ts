import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;



const Invite = new Schema(
  {
    user_id : { type: Schema.Types.ObjectId, ref: "User", default: null, },
    email : { type : String, default : null},
    mobile_number : { type : String, default : null},
    country_code : { type : String, default : null},
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);
mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("Invite", Invite);
