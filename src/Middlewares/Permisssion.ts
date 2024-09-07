import * as mongoose from "mongoose";
import User, { UserTypes } from "../models/User";

export const Permissions = {
  DASHBOARD: "dashboard-management",
  Role: "role-manager",
  TEACHER: "teacher-manager",
  CATEGORY: "category-management",
  RESTAURANT: "restaurant-manager",
  STUDENT: "student-manager",
  ORDER: "order-manager",
  DRIVER: "driver-manager",
  CMS: "cms-manager",
  DELIVERY_HISTORY: "delivery-manager",
  RATING_AND_REVIEWS: "rating-manager",
  REPORTS: "report-manager",
  FINANCE: "finance-manager",
  COLLECTION: "collector-manager",
  LOCATION: "service-location-manager",
  DISCOUNT: "discount-manager",

  EMAIL: "email-template-manager",
  BLOG: "blog-manager",
  DELIVERYCHARGE: "delivery-charge-manager",
  SUBCATEGORY: "sub-category-management",
  EVENTTYPE: "event-manager",
  SERVICE: "service-manager",
  SERVICEPROVIDER: "provider-manager",
  QUOTATION: "quotation-request",
  ATTRIBUTE: "attribute-manager",
  QUOTETEMPLATE: "quote-template-manager",
  PROVIDERPROFILE: "profile-manager",
};

const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    const permission = requiredPermissions;
    let userPermissions = [];
    const userRole = await User.findById(req.user.id);
    if (userRole) {
      userPermissions = userRole.permission;
    }

    if (req.user.type == UserTypes.ADMIN) {
      req.filter = {};
      req.filter1 = {};
      next();
    } else if (userPermissions.length) {
      const hasPermission = userPermissions?.includes(permission);

      if (!hasPermission) {
        return res.status(403).json({ message: "Permission denied" });
      }
      next();
    } else {
      return res.status(403).json({ message: "Permission denied" });
    }
  };
};

export default checkPermission;
