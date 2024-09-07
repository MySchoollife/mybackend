import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const Position = {
  TOP: "Top banner",
  MID: "Mid banner",
  BOTTOM: "Bottom banner",
  NULL: null
};

const Banner = new Schema(
  {
    image: { type: String, default: null, },
    mobile_image: { type: String, default: null, },
    start_date: { type: Date, default: null },
    end_date: { type: Date, default: null },
    price: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    rotation_time: { type: String, default: null },
    banner_link: { type: String, default: null },
    position: { type: String, enum: Object.values(Position), default: null },
    is_active: { type: Boolean, default: true, },
    is_delete: { type: Boolean, default: false, },
    banner_for : { type: String, default: null },
    category_id :  { type: Schema.Types.ObjectId, ref: "Category", default: null, },
    vendor_id :  { type: Schema.Types.ObjectId, ref: "Provider", default: null, },
    country_id: { type: Schema.Types.ObjectId, ref: "ServiceCountry", default: null, },

  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);
mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("Banner", Banner);
