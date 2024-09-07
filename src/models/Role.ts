import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const UserTypes = {
  ADMIN: "Admin",
  SPECIALIST: "Specialist",
  DRIVER: "Driver",
  CUSTOMER: "Customer",
  DEALER: "Dealer",
  SUB_ADMIN: "SubAdmin",
  VENDOR: "Vendor",
};

export const ApproveStatus = {
  REJECT: "rejected",
  ACCEPT: "accepted",
  SUSPENDED: "suspended",
  PENDING: "pending",
};

const Role = new Schema(
  {
    uid: { type: String, default: null },
    name: { type: String, default: null },
    permission: { type: Array, default: [] },
    language: { type: String, default: "en" },
    user_language: { type: String, enum: ["en", "ar"], default: 'en' },
    is_active: { type: Boolean, default: true },
    is_verify: { type: Boolean, default: false },
    is_delete: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    added_by: { type: String, default: null },
    type: { type: String, enum: Object.values(UserTypes), default: null },
    country_id: { type: Schema.Types.ObjectId, ref: "ServiceCountry", default: null, },
    is_available: { type: Boolean, default: true },
    timezone: { type: String, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

Role.pre('save', function (next) {
  if (!this['uid']) {
    this['uid'] = generateRandomId();
  }

  if (!this['refer_code']) {
    this['refer_code'] = generateUniqueReferCode(6);
  }

  next();
})

function generateRandomId() {
  return Math.floor(100000 + Math.random() * 900000);
}

function generateUniqueReferCode(length) {
  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;

  for (var i = 0; i < length; i++) {
    var randomIndex = Math.floor(Math.random() * charactersLength);
    result.push(characters[randomIndex]);
  }

  return result.join('');
}

// function generateUniqueReferCode() {
//   const timestampPart = Date.now().toString(36).slice(-4); // Using the last 4 characters of the current timestamp
//   const randomPart = generateRandomReferCode(4); // Using 4 random characters

//   return `${timestampPart}${randomPart}`;
// }

function generateRandomReferCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

mongoose.plugin(aggregatePaginate);
Role.index({ name: "text" });
Role.index({ user_location: "2dsphere" });

export default model<any, AggregatePaginateModel<any>>("role", Role);
