import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const UserTypes = {
  ADMIN: "Admin",
  TEACHER: "Teacher",
  NULL: null,
};

const User = new Schema(
  {
    uid: { type: String, default: null },
    name: { type: String, default: null },
    mobile_number: { type: String, default: null },
    country_code: { type: String, default: null },
    email: { type: String, default: null },
    password: { type: String },
    otp: { type: Number, default: null },
    dob: { type: String, default: null },
    gender: { type: String, enum: ["M", "F", "O", null], default: null },
    language: { type: String, default: "en" },

    image: { type: String, default: null },
    is_active: { type: Boolean, default: true },

    is_delete: { type: Boolean, default: false },
    is_otp_verify: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    added_by: { type: String, default: null },
    type: { type: String, enum: Object.values(UserTypes), default: null },
    device_token: { type: String, default: null },
    device_type: { type: String, default: null },
    profession: { type: String, default: null },

    document: [{ type: String, default: null }],
    bank_details: {
      acc_number: { type: String, default: null },
      bank_name: { type: String, default: null },
      beneficiary_name: { type: String, default: null },
      iban_number: { type: String, default: null },
      beneficiary_address: { type: String, default: null },
    },

    //admin
    bio: { type: String, default: null },
    pincode: { type: String, default: null },
    city_id: { type: String, default: null },
    state_id: { type: String, default: null },
    country_id: { type: String, default: null },
    address: { type: String, default: null },
    website_url: { type: String, default: null },

    //subAdmin
    role_title: { type: String, default: null },
    permission: { type: Array, default: [] },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

User.pre("save", function (next) {
  if (!this["uid"]) {
    this["uid"] = generateRandomId();
  }

  next();
});

function generateRandomId() {
  return Math.floor(100000 + Math.random() * 900000);
}

mongoose.plugin(aggregatePaginate);
User.index({ name: "text" });
User.index({ user_location: "2dsphere" });

export default model<any, AggregatePaginateModel<any>>("User", User);
