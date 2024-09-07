import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const StatusTypes = {
  LEAD: "Lead",
};

const Status = new Schema(
  {
    uid: { type: String, default: null },
    name: { type: String, default: null },
    type: { type: String, enum: Object.values(StatusTypes), default: null },
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

Status.pre("save", function (next) {
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
Status.index({ name: "text" });
Status.index({ user_location: "2dsphere" });

export default model<any, AggregatePaginateModel<any>>("Status", Status);
