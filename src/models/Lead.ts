import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const Lead = new Schema(
  {
    uid: { type: String, default: null },
    name: { type: String, default: null },
    admission_class_id: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    source_id: {
      type: Schema.Types.ObjectId,
      ref: "Source",
      default: null,
    },
    attended_class_id: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    lead_status_id: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },

    referred_id: { type: String, default: null },
    email: { type: String, default: null },
    dob: { type: Date, default: null },
    gender: { type: String, default: null },
    mobile_number: { type: String, default: null },
    country_code: { type: String, default: null },
    nationality: { type: String, default: null },
    religion: { type: String, default: null },
    category: { type: String, default: null },
    aadhar_number: { type: Number, default: null },
    school_pincode: { type: Number, default: null },
    school_address: { type: String, default: null },
    city_id: { type: String, default: null },
    country_id: { type: String, default: null },
    address: { type: String, default: null },
    remark: { type: String, default: null },
    guardian_name: { type: String, default: null },
    relation: { type: String, default: null },
    guardian_email: { type: String, default: null },
    guardian_occupation: { type: Number, default: null },
    guardian_mobile_number: { type: String, default: null },
    guardian_country_code: { type: String, default: null },

    language: { type: String, default: "en" },
    is_active: { type: Boolean, default: true },
    is_delete: { type: Boolean, default: false },
    added_by: { type: String, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

Lead.pre("save", function (next) {
  if (!this["uid"]) {
    this["uid"] = generateRandomId();
  }

  if (!this["refer_code"]) {
    this["refer_code"] = generateUniqueReferCode(6);
  }

  next();
});

function generateRandomId() {
  return Math.floor(100000 + Math.random() * 900000);
}

function generateUniqueReferCode(length) {
  var result = [];
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charactersLength = characters.length;

  for (var i = 0; i < length; i++) {
    var randomIndex = Math.floor(Math.random() * charactersLength);
    result.push(characters[randomIndex]);
  }

  return result.join("");
}

mongoose.plugin(aggregatePaginate);
Lead.index({ name: "text" });
Lead.index({ user_location: "2dsphere" });

export default model<any, AggregatePaginateModel<any>>("Lead", Lead);
