import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const FavTypes = {
  RESTAURANT: "Restaurant",
  FOOD: "Food",
};

const Wishlist = new Schema(
  {
    type: { type: String, enum: Object.values(FavTypes), default: null, },
    customer_id: { type: Schema.Types.ObjectId, ref: 'User' },
    restaurant_id: { type: Schema.Types.ObjectId, ref: 'Restaurant' },
    food_id: { type: Schema.Types.ObjectId, ref: 'FoodItem' },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("Wishlist", Wishlist);
