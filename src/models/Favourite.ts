import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const favourite_type  = {
  PROVIDER : "Provider",
  SERVICE : "Service",
  NULL: null
};

const Favourite = new Schema(
  {
    type : { type: String, enum: Object.values(favourite_type ), default: null },
    vendor_id :  { type: Schema.Types.ObjectId, ref: "Provider", default: null, },
    service_id :  { type: Schema.Types.ObjectId, ref: "Service", default: null, },
    user_id :  { type: Schema.Types.ObjectId, ref: "User", default: null, },

  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);
mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("Favourite", Favourite);
