import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
import { ADDED_BY_TYPES } from "../constants/added-by-types.constants";
import { ApproveStatus } from "./User";

const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const Provider = new Schema(
  {
    uid: { type: String, default: null },
    name: { type: String, default: null },
    ar_name: { type: String, default: null },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    sub_category_id: [
      { type: Schema.Types.ObjectId, ref: "SubCategory", default: [] },
    ],
    vendor_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    delivery_time: { type: String, default: null },
    delivery_type: { type: Array, default: ["Delivery"] },
    min_order_price: { type: Number, default: null },
    approx_delivery_time: { type: String, default: null },
    description: { type: String, default: null },
    ar_description: { type: String, default: null },
    tax: { type: Number, default: null },
    commission_rate: { type: Number, default: null },
    business_id: { type: String, default: null },
    contact_person_name: { type: String, default: null },
    mobile_number: { type: String, default: null },
    country_code: { type: String, default: null },
    mobile_number_secondary: { type: String, default: null },
    country_code_secondary: { type: String, default: null },
    email: { type: String, default: null },
    otp: { type: Number, default: null },
    address: { type: String, default: null },
    ar_address: { type: String, default: null },
    city: { type: String, default: null },
    country: { type: String, default: null },
    area: { type: Schema.Types.ObjectId, ref: "ServiceArea", default: null },
    location: {
      type: { type: String },
      coordinates: [Number],
    },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    map_address: { type: String, default: null },
    logo: { type: String, default: null },
    cover_photo: { type: String, default: null },
    website_url: { type: String, default: null },
    image: [{ type: String, default: null }],
    auto_accept_order: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true },
    is_verify: { type: Boolean, default: false },
    is_delete: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    added_by: { type: String, enum: Object.values(ADDED_BY_TYPES) },
    document: [{ type: String, default: null }],
    device_token: { type: String, default: null },
    device_type: { type: String, default: null },
    country_id: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCountry",
      default: null,
    },
    state_id: { type: Schema.Types.ObjectId, ref: "State", default: null },
    city_id: { type: Schema.Types.ObjectId, ref: "ServiceCity", default: null },
    associated_manager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    profile_id: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      default: null,
    },
    eventtype_id: [
      { type: Schema.Types.ObjectId, ref: "EventType", default: [] },
    ],
    
    packages: [
      {
        package_service_id: [
          { type: Schema.Types.ObjectId, ref: "EventType", default: [] },
        ],
        name: { type: String, default: null },
        original_price: { type: Number, default: null },
        discounted_price : { type: Number, default: null },

      }
    ],
    services: [
      {
        service_id: { type: Schema.Types.ObjectId, ref: "Service", default: null },
        attribute_id: [
          { type: Schema.Types.ObjectId, ref: "Attribute", default: [] },
        ],
        original_price: { type: Number, default: null },
        discount_price: { type: Number, default: null },
      }
    ], 
    approve_status: {
      type: String,
      enum: Object.values(ApproveStatus),
      default: ApproveStatus.PENDING,
    },
    profile_completion: { type: Number, default: 50 },
    have_whatsapp: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },
    twitter_link: { type: String, default: null },
    facebook_link: { type: String, default: null },
    instagram_link: { type: String, default: null },
    is_favourite: { type: Boolean, default: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

Provider.pre("save", function (next) {
  if (!this["uid"]) {
    this["uid"] = generateRandomId();
  }
  next();
});

function generateRandomId() {
  return Math.floor(100000 + Math.random() * 900000);
}

mongoose.plugin(aggregatePaginate);
Provider.index({ name: "text" });
Provider.index({ location: "2dsphere" });

export default model<any, AggregatePaginateModel<any>>("Provider", Provider);
