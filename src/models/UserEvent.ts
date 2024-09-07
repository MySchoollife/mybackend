import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const UserEvent = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", default: null, },
    event_id: { type: Schema.Types.ObjectId, ref: "EventType", default: null, },
    budget: { type: Number, default: null },
    date: { type: Date, default: new Date() },
    location: {
      type: { type: String },
      coordinates: [Number],
    },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    is_active: { type: Boolean, default: true, },
    is_delete: { type: Boolean, default: false, },

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
UserEvent.index({ name: 'text' });
export default model<any, AggregatePaginateModel<any>>("UserEvent", UserEvent);
