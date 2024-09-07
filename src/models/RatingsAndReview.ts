import * as mongoose from "mongoose";
import { AggregatePaginateModel, model } from "mongoose";

const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const Rating = {
  Restaurant: 'Restaurant',
  Driver: 'Driver',
  Customer: 'Customer',
  Food: 'Food',
  App :'App'
}

const ReplySchema = new Schema(
  {
    sender_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    message: {
      type: String, default: null
    }
  }, {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
}
)

const RatingAndReview = new Schema(
  {
    country_id: { type: Schema.Types.ObjectId, ref: "ServiceCountry", default: null },
    city_id: { type: Schema.Types.ObjectId, ref: "ServiceCity", default: null },
    reviewer_id: { type: Schema.Types.ObjectId, ref: "User", default: null }, // the one who adds a review
    reviewee_id: { type: Schema.Types.ObjectId, ref: "User", default: null }, //  the one to whom review was added by the other person
    food_id: { type: Schema.Types.ObjectId, ref: "FoodItem", default: null }, //  the one to whom review was added by the other person
    order_id: { type: Schema.Types.ObjectId, ref: "Order", default: null },   // driver_id, food_id, restaurant_id ...  are all contained in order id
    rating_for: { type: String, enum: [,'Provider','Customer','ProviderApp','CustomerApp'], default: null },   // driver_id, food_id, restaurant_id ...  are all contained in order id
    rating: { type: Number, default: 0 },
    images: [{ type: String, default: null }],
    review: { type: String, default: null },
    replies: [{ type: ReplySchema, default: null }],
    is_active: { type: Boolean, default: true },
    is_delete: { type: Boolean, default: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);
mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("RatingAndReview", RatingAndReview);