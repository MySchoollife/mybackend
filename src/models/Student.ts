import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const UserTypes = {
  STUDENT: "Student",
  NULL: null,
};

const Student = new Schema(
  {
    uid: { type: String, default: null },
    name: { type: String, default: null },
    mobile_number: { type: String, default: null },
    country_code: { type: String, default: null },
    email: { type: String, default: null },
    classname: { type: String, default: null },
    c_address: { type: String, default: null },
    p_address: { type: String, default: null },
    addmission_number: { type: String, default: null },
    join_date: { type: Date, default: null },
    roll_number: { type: Number, default: null },
    father_name: { type: String, default: null },
    mother_name: { type: String, default: null },
    occupation: { type: Number, default: null },
    parent_email: { type: String, default: null },
    parent_mobile_number: { type: String, default: null },
    Parent_country_code: { type: String, default: null },
    parent_other_mobile_number: { type: String, default: null },
    Parent_other_country_code: { type: String, default: null },
    password: { type: String },
    otp: { type: Number, default: null },
    dob: { type: String, default: null },
    gender: { type: String, enum: ["M", "F", "O", null], default: null },
    language: { type: String, default: "en" },
    image: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    is_delete: { type: Boolean, default: false },
    is_otp_verify: { type: Boolean, default: false },
    type: { type: String, enum: Object.values(UserTypes), default: null },
    device_token: { type: String, default: null },
    device_type: { type: String, default: null },
    //subAdmin
    role_id: { type: Schema.Types.ObjectId, ref: "role", default: null },
    permission: { type: Array, default: [] },
    refer_code: { type: String, unique: true, default: null },
    rating: { type: Number, default: 0 },
    review_count: { type: Number, default: 0 },
    timezone: { type: String, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

Student.pre("save", function (next) {
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
Student.index({ name: "text" });
Student.index({ user_location: "2dsphere" });

export default model<any, AggregatePaginateModel<any>>("Student", Student);
