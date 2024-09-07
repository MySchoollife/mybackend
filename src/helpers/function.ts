import * as mongoose from "mongoose";
import ActivityLog from "../models/ActivityLog";
import User, { UserTypes } from "../models/User";
import ChangeLog from "../models/ChangeLog";

export const activityLog = async (action, message, user_id) => {
  const user = await User.findById(user_id);
  if (!user) return;
  await ActivityLog.create({
    action,
    message,
    user_id,
  });
};

export const changeLog = async (action, message, sub_admin) => {
  const subAdmin = await User.findById(sub_admin);
  if (!subAdmin) {
    return;
  }

  const data = await ChangeLog.create({
    action,
    message,
    user_id: subAdmin,
  });

  console.log(
    "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
  );
  console.log("=>>>   ", data);
};
