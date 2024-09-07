import { boolean } from "joi";
import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;



const Profile = new Schema(
  {
    uid: { type: String, default: null },
    name: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    is_delete: { type: Boolean, default: false },
    added_by: { type: String, default: null },
    xlurl: { type: String, default: null },
    permission: [{
      name: { type: String, default: null },
      label: { type: String, default: null },
      is_selected: { type: Boolean, default: false },
      is_required: { type: Boolean, default: false },
    }],
    category_id: { type: Schema.Types.ObjectId, ref: "Category", default: null, },
    country_id: { type: Schema.Types.ObjectId, ref: "ServiceCountry", default: null, },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

Profile.pre('save', function (next) {
  if (!this['uid']) {
    this['uid'] = generateRandomId();
  }
  next();
})

function generateRandomId() {
  return Math.floor(100000 + Math.random() * 900000);
}


mongoose.plugin(aggregatePaginate);
Profile.index({ name: "text" });
Profile.index({ user_location: "2dsphere" });

export default model<any, AggregatePaginateModel<any>>("Profile", Profile);
