import * as mongoose from "mongoose";
import { model, AggregatePaginateModel } from "mongoose";
import { UserTypes } from "./User";
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

export const OtpUseFor = {
    SIGNUP: "SignUp",
    FORGET: "ForgetPassword",
    SUSPENDED: "Suspended",
    LOGIN: "Login",
  };

const Otp = new Schema(
  {
    mobile_number: { type: String, default: null },
    country_code: { type: String, default: null },
    email: { type: String, default: null },
    type: { type: String, enum: Object.values(UserTypes), default: null},
    use_for: { type: String, enum: Object.values(OtpUseFor), default: null},
    otp: { type: Number, default: null },
    is_used: { type: Boolean, default: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

mongoose.plugin(aggregatePaginate);

export default model<any, AggregatePaginateModel<any>>("Otp", Otp);
