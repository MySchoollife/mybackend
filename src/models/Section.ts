import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const Section = new Schema(
  {
    uid: { type: String, default: null },
    name: { type: String, default: null },
    order_number: { type: Number, default: null },
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

Section.pre("save", function (next) {
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
Section.index({ name: "text" });
Section.index({ user_location: "2dsphere" });

export default model<any, AggregatePaginateModel<any>>("Section", Section);
