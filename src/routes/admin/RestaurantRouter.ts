import { Router } from "express";
import * as mongoose from "mongoose";
import Helper from "../../helpers/Helper";
import { body, param, query } from "express-validator";
import Authentication from "../../Middlewares/Authnetication";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import ServiceCity from "../../models/ServiceCity";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import Auth from "../../Utils/Auth";
import _RS from "../../helpers/ResponseHelper";
import Provider from "../../models/Provider";
import User, { ApproveStatus, UserTypes } from "../../models/User";
import { activityLog, changeLog } from "../../helpers/function";
import { Action } from "../../models/ActivityLog";
import EmailTemplate from "../../models/EmailTemplate";
import MailHelper from "../../helpers/MailHelper";
import ServiceCountry from "../../models/ServiceCountry";
import { NOTIFICATION } from "../../constants/notifications";
import AvailabilityProvider from "../../models/AvailabilityProvider";
import ProviderProfile from "../../models/ProviderProfile";
import Category from "../../models/Category";
import SubCategory from "../../models/SubCategory";
import City from "../../models/City";
import Serivces from "../../models/Serivces";
import EventType from "../../models/EventType";
import { ChangeLogAction } from "../../models/ChangeLog";

const collationOptions = {
  locale: "en",
  strength: 2,
};

class RestaurantRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
  }

  public post() {
    this.router.post(
      "/",
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      [],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const {
            eventtype_id,
            twitter_link,
            facebook_link,
            instagram_link,
            website_url,
            cover_photo,
            service_id,
            images_per_service,
            number_of_service,
            map_address,
            mobile_number_sec,
            country_code_sec,
            have_whatsapp,
            have_whatsapp_sec,
            auto_accept_order,
            name,
            ar_name,
            logo,
            category_id,
            description,
            ar_description,
            open_time,
            close_time,
            contact_person_name,
            mobile_number,
            country_code,
            delivery_type,
            working_days,
            sub_category_id,
            email,
            password,
            address,
            ar_address,
            area,
            latitude,
            longitude,
            image,
            document,
            device_token,
            device_type,
            city_id,
            country_id,
            associated_manager,
            profile_id,
            values,
            packages,
            services
          } = req.body;

          const formFields = [
            eventtype_id,
            twitter_link,
            facebook_link,
            instagram_link,
            website_url,
            cover_photo,
            service_id,
            images_per_service,
            number_of_service,
            map_address,
            mobile_number_sec,
            country_code_sec,
            have_whatsapp,
            have_whatsapp_sec,
            auto_accept_order,
            name,
            ar_name,
            logo,
            category_id,
            description,
            ar_description,
            open_time,
            close_time,
            contact_person_name,
            mobile_number,
            country_code,
            delivery_type,
            working_days,
            sub_category_id,
            email,
            password,
            address,
            ar_address,
            area,
            latitude,
            longitude,
            image,
            document,
            device_token,
            device_type,
            city_id,
            country_id,
            associated_manager,
            profile_id,
            values,
            packages,
            services
          ]

          const profile = await ProviderProfile.findById(profile_id);

          const count = profile?.permission?.reduce((item, acc) => {
            return item?.is_required ? acc + 1 : acc
          }, 0);

          let percentage = 0;

          profile?.permission?.map((item) => {
            if (item?.is_required) {
              let a = formFields.indexOf(item.name);
              if (a >= 0 && !!formFields[a]) {
                percentage = percentage + (100 / count);
              }
            }
          })

          const data = await Provider.create({
            number_of_service,
            images_per_service,
            delivery_type,
            logo,
            auto_accept_order,
            name,
            ar_name,
            description,
            ar_description,
            open_time,
            close_time,
            contact_person_name,
            mobile_number,
            country_code,
            password: password
              ? await Auth.encryptPassword(password)
              : password,
            location:
              longitude && latitude
                ? {
                  type: "Point",
                  coordinates: [longitude, latitude],
                }
                : null,
            address,
            ar_address,
            area,
            latitude,
            longitude,
            image,
            document,
            device_token,
            device_type,
            is_verify: true,
            map_address,
            service_id: service_id ? service_id : null,
            cover_photo,
            website_url,
            twitter_link,
            facebook_link,
            instagram_link,
            eventtype_id: eventtype_id ? eventtype_id : null,
            packages: packages ? packages : null,
            services: services ? services : null,
            category_id: category_id ? category_id : null,
            associated_manager: associated_manager ? associated_manager : null,
            profile_id: profile_id ? profile_id : null,
            profile_completion: percentage,
            email: email ? email.toLowerCase() : email,
            sub_category_id: sub_category_id ? sub_category_id : null,
            city_id: city_id ? city_id : null,
            country_id: country_id ? country_id : null,
          });

          const user = await User.create({
            name,
            ar_name,
            image: logo,
            mobile_number,
            country_code,
            email: email ? email.toLowerCase() : email,
            type: UserTypes.VENDOR,
            city_id,
            country_id,
            password: password
              ? await Auth.encryptPassword(password)
              : password,
            restaurant_id: data._id,

            is_verify: true,
            is_otp_verify: true,
            mobile_number_sec,
            country_code_sec,
            have_whatsapp,
            have_whatsapp_sec,
          });

          data.vendor_id = user._id;

          await data.save();

          if (working_days) {
            await Promise.all(
              working_days.map(async (days) => {
                const { day, time } = days;
                if (day && time) {
                  const [open_time, close_time] = time;
                  console.log(open_time, close_time, day, "day11");
                  if (day && open_time && close_time) {
                    const isAlready = await AvailabilityProvider.findOne({
                      provider_id: data._id,
                      day,
                    });

                    if (isAlready) {
                      const updateData = await AvailabilityProvider.updateOne({
                        provider_id: data._id,
                        day,
                        open_time,
                        close_time,
                      });
                    } else {
                      const createData = await AvailabilityProvider.create({
                        provider_id: data._id,
                        day,
                        open_time,
                        close_time,
                      });
                    }
                  }
                }
              })
            );
          }

          const s_country = await ServiceCountry.findById(country_id);
          const s_city = await ServiceCity.findById(city_id);

          //Email

          const emailTemplate = await EmailTemplate.findOne({
            slug: "welcome-and-password-restaurant",
          });

          if (emailTemplate) {
            let replacedHTML = emailTemplate.description;
            replacedHTML = replacedHTML
              .replace("[NAME]", user.name || "")
              .replace("[PASSWORD]", password)
              .replace("[COUNTRY]", s_country?.name ?? "")
              .replace("[CITY]", s_city?.name ?? "")
              .replace("[EMAIL]", user.email || "")
              .replace("[URL]", process.env.RESTAURANT_URL || "");

            let arHTML = emailTemplate.ar_description;
            arHTML = arHTML
              .replace("[NAME]", user.ar_name || "")
              .replace("[PASSWORD]", password)
              .replace("[COUNTRY]", s_country?.name ?? "")
              .replace("[CITY]", s_city?.name ?? "")
              .replace("[EMAIL]", user.email || "")
              .replace("[URL]", process.env.RESTAURANT_URL || "");

            await MailHelper.sendMail(
              user.email,
              emailTemplate.subject,
              replacedHTML,
              arHTML
            );
          }

          if (req.user.type == UserTypes.SUB_ADMIN) {
            await changeLog(ChangeLogAction.ADD, `Add New Provider ${user?.name}.`, req.user.id);
          }

          return _RS.apiNew(
            res,
            true,
            "Provider add successfully",
            { data },
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.put(
      "/:id",
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      [],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const restaurant = await Provider.findById(id);

          if (!restaurant) {
            return _RS.apiNew(res, false, "Provider not found", {}, startTime);
          }

          const {
            eventtype_id,
            twitter_link,
            facebook_link,
            instagram_link,
            website_url,
            cover_photo,
            number_of_service,
            images_per_service,
            mobile_number_sec,
            country_code_sec,
            have_whatsapp,
            have_whatsapp_sec,
            auto_accept_order,
            associated_manager,
            name,
            ar_name,
            logo,
            category_id,
            description,
            ar_description,
            working_days,
            contact_person_name,
            mobile_number,
            country_code,
            sub_category_id,
            email,
            password,
            address,
            ar_address,
            area,
            latitude,
            longitude,
            image,
            document,
            map_address,
            device_type,
            city_id,
            service_id,
            country_id,
            profile_id,
            values,
            device_token,
            packages,
            services
          } = req.body;

          const formFields = [
            eventtype_id,
            twitter_link,
            facebook_link,
            instagram_link,
            website_url,
            cover_photo,
            images_per_service,
            number_of_service,
            map_address,
            mobile_number_sec,
            country_code_sec,
            have_whatsapp,
            have_whatsapp_sec,
            auto_accept_order,
            name,
            ar_name,
            logo,
            category_id,
            description,
            ar_description,
            contact_person_name,
            mobile_number,
            country_code,
            working_days,
            sub_category_id,
            email,
            password,
            address,
            ar_address,
            area,
            latitude,
            longitude,
            image,
            document,
            device_token,
            device_type,
            city_id,
            country_id,
            associated_manager,
            profile_id,
            values,
            packages,
            services
          ]

          const profile = await ProviderProfile.findById(profile_id);

          const count = profile?.permission?.reduce((item, acc) => {
            return item?.is_required ? acc + 1 : acc
          }, 0);

          let percentage = 0;

          profile?.permission?.map((item) => {
            if (item?.is_required) {
              let a = formFields.indexOf(item.name);
              if (a >= 0 && !!formFields[a]) {
                percentage = percentage + (100 / count);
              }
            }
          })

            (restaurant.profile_completion = percentage),
            (restaurant.name = name ? name : restaurant.name);
          restaurant.logo = logo ? logo : restaurant.logo;
          restaurant.ar_name = ar_name ? ar_name : restaurant.ar_name;
          restaurant.profile_id = profile_id
            ? profile_id
            : restaurant.profile_id;
          restaurant.description = description
            ? description
            : restaurant.description;
          restaurant.ar_description = ar_description
            ? ar_description
            : restaurant.ar_description;
          restaurant.contact_person_name = contact_person_name
            ? contact_person_name
            : restaurant.contact_person_name;
          restaurant.mobile_number = mobile_number
            ? mobile_number
            : restaurant.mobile_number;
          restaurant.country_code = country_code
            ? country_code
            : restaurant.country_code;
          restaurant.email = email ? email : restaurant.email;
          restaurant.have_whatsapp = have_whatsapp;
          restaurant.address = address ? address : restaurant.address;
          restaurant.ar_address = ar_address
            ? ar_address
            : restaurant.ar_address;
          restaurant.country_id = country_id
            ? country_id
            : restaurant.country_id;
          restaurant.city_id = city_id ? city_id : restaurant.city_id;
          restaurant.category_id = category_id
            ? category_id
            : restaurant.category_id;
          restaurant.sub_category_id = sub_category_id
            ? sub_category_id
            : restaurant.sub_category_id;
          restaurant.associated_manager = associated_manager
            ? associated_manager
            : restaurant.associated_manager;
          restaurant.latitude = latitude ? latitude : restaurant.latitude;
          restaurant.longitude = longitude ? longitude : restaurant.longitude;
          restaurant.image = image ? image : restaurant.image;
          restaurant.document = document ? document : restaurant.document;
          restaurant.map_address = map_address
            ? map_address
            : restaurant.map_address;
          restaurant.images_per_service = images_per_service
            ? images_per_service
            : restaurant.images_per_service;
          restaurant.number_of_service = number_of_service
            ? number_of_service
            : restaurant.number_of_service;
          restaurant.website_url = website_url
            ? website_url
            : restaurant.website_url;
          restaurant.twitter_link = twitter_link
            ? twitter_link
            : restaurant.twitter_link;
          restaurant.facebook_link = facebook_link
            ? facebook_link
            : restaurant.facebook_link;
          restaurant.instagram_link = instagram_link
            ? instagram_link
            : restaurant.instagram_link;
          restaurant.eventtype_id = eventtype_id
            ? eventtype_id
            : restaurant.eventtype_id;
          restaurant.values = values?.length
            ? values
            : restaurant.values;
          restaurant.packages = packages
            ? packages
            : restaurant.packages;

          restaurant.services = services
            ? services
            : restaurant.services;



          restaurant.location =
            longitude && latitude
              ? {
                type: "Point",
                coordinates: [longitude, latitude],
              }
              : restaurant.location;

          await restaurant.save();

          const user = await User.findById(restaurant.vendor_id);
          if (user) {
            user.name = name ? name : user.name;
            user.ar_name = ar_name ? ar_name : user.ar_name;
            user.email = email ? email?.toLowerCase() : user.email;
            user.mobile_number = mobile_number
              ? mobile_number
              : user.mobile_number;
            user.country_code = country_code ? country_code : user.country_code;
            user.image = logo ? logo : user.image;
            (user.password = password
              ? await Auth.encryptPassword(password)
              : user.password),
              await user.save();
          }

          if (working_days) {
            console.log("working_days11", working_days);
            const existingRecords = await AvailabilityProvider.find({
              provider_id: restaurant._id,
            });
            await Promise.all(
              working_days.map(async (days) => {
                const { day, time } = days;
                if (day && time) {
                  const [open_time, close_time] = time;
                  console.log(open_time, close_time, day, "day11");
                  const existingRecord = existingRecords.find(
                    (record) => record.day === day
                  );
                  if (existingRecord) {
                    const updateData = await AvailabilityProvider.updateOne(
                      { _id: existingRecord._id },
                      { open_time, close_time }
                    );
                  } else {
                    const createData = await AvailabilityProvider.create({
                      provider_id: restaurant._id,
                      day,
                      open_time,
                      close_time,
                    });
                  }
                }
              })
            );
            const daysToDelete = existingRecords.filter(
              (record) => !working_days.some((day) => day.day === record.day)
            );
            await Promise.all(
              daysToDelete.map(async (record) => {
                const deleteResult = await AvailabilityProvider.deleteOne({
                  _id: record._id,
                });
              })
            );
          }

          if (password) {
            const emailTemplate = await EmailTemplate.findOne({
              slug: "welcome-and-update-password-planit",
            });
            const s_country = await ServiceCountry.findById(country_id);
            if (emailTemplate) {
              let replacedHTML = emailTemplate.description;
              replacedHTML = replacedHTML
                .replace("[NAME]", user.name || "")
                .replace("[PASSWORD]", password)
                .replace("[COUNTRY]", s_country?.name ?? "")
                .replace("[EMAIL]", user.email || "")
                .replace("[URL]", process.env.RESTAURANT_URL || "");

              let arHTML = emailTemplate.ar_description;
              arHTML = arHTML
                .replace("[NAME]", user.ar_name || "")
                .replace("[PASSWORD]", password)
                .replace("[COUNTRY]", s_country?.name ?? "")
                .replace("[EMAIL]", user.email || "")
                .replace("[URL]", process.env.RESTAURANT_URL || "");

              await MailHelper.sendMail(
                user.email,
                emailTemplate.subject,
                replacedHTML,
                arHTML
              );
            }
          }

          if (req.user.type == UserTypes.SUB_ADMIN) {
            await changeLog(ChangeLogAction.UPDATE, `Updated Provider ${user?.name}.`, req.user.id);
          }


          return _RS.apiNew(
            res,
            true,
            "Provider updated successfully",
            restaurant,
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.put(
      "/:id/status",
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      [
        param("id")
          .notEmpty()
          .isMongoId()
          .withMessage("Valid id must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const restaurant = await Provider.findById(id);

          if (!restaurant) {
            return _RS.apiNew(res, false, "Provider not found", {}, startTime);
          }

          const user = await User.findById(restaurant.vendor_id);

          const { message } = req.body;
          if (user.is_active) activityLog(Action.BLOCK, message, user._id);
          else activityLog(Action.UNBLOCK, message, user._id);

          user.is_active = !restaurant.is_active;
          await user.save();

          restaurant.is_active = !restaurant.is_active;

          await restaurant.save();

          if (req.user.type == UserTypes.SUB_ADMIN) {
            await changeLog(ChangeLogAction.STATUS, `Changed Status Provider ${restaurant?.name}.`, req.user.id);
          }
          return _RS.apiNew(
            res,
            true,
            "Provider status changed successfully",
            restaurant,
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.delete(
      "/:id",
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      [
        param("id")
          .notEmpty()
          .isMongoId()
          .withMessage("Valid id must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const restaurant = await Provider.findById(id);

          if (!restaurant) {
            return _RS.apiNew(res, false, "Provider not found", {}, startTime);
          }

          restaurant.is_delete = true;

          await restaurant.save();

          if (req.user.type == UserTypes.SUB_ADMIN) {
            await changeLog(ChangeLogAction.DELETE, `Deleted Provider ${restaurant?.name}.`, req.user.id);
          }
          return _RS.apiNew(
            res,
            true,
            "Provider deleted successfully",
            restaurant,
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );



    this.router.put(
      "/:id/feature",
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      [
        param("id")
          .notEmpty()
          .isMongoId()
          .withMessage("Valid id must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const id = req.params.id;

          const restaurant = await Provider.findById(id);

          if (!restaurant) {
            return _RS.apiNew(res, false, "Provider not found", {}, startTime);
          }

          restaurant.is_featured = !restaurant.is_featured;

          await restaurant.save();

          const user = await User.findOne({ _id: restaurant.vendor_id });

          if (user) {
            user.is_featured = !user.is_featured;
            await user.save();
          }

          return _RS.apiNew(
            res,
            true,
            "Feature status changed successfully",
            restaurant,
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.post(
      "/status-change-all",
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      [
        body("ids")
          .notEmpty()
          .isArray()
          .withMessage("Valid provider ids must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const ids = req.body.ids;
          // const haveItem = await SubCategory.findOne({ category_id: { $in: ids }, country_id: req.country_id, is_delete: false })
          // console.log("haveItem", haveItem)
          // if (haveItem) {
          //   return _RS.badRequest(
          //     res,
          //     "NOTFOUND",
          //     "This category contains Sub-Category, please remove  this sub category from sub category before deleting category",
          //     {},
          //     startTime,
          //   );
          // }

          const getProvider = await Provider.updateMany(
            { _id: { $in: ids } },
            { $set: { is_active: false } }
          );

          if (!getProvider) {
            return _RS.notFound(
              res,
              "NOTFOUND",
              "Provider not found",
              getProvider,
              startTime
            );
          }

          return _RS.ok(
            res,
            "SUCCESS",
            "Provider's all Deactivate successfully",
            getProvider,
            startTime
          );
        } catch (err) {
          next(err);
        }
      }
    );

    this.router.post(
      "/import",
      [
        body("sheet")
          .notEmpty()
          .isArray()
          .withMessage("Valid sheet must be provided"),
        body("category_id")
          .notEmpty()
          .withMessage("Valid category id must be provided"),
        body("profile_id")
          .notEmpty()
          .withMessage("Valid profile id must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const { sheet, category_id, profile_id } = req.body;
          const country_id = req.country_id;

          await Promise.all(
            sheet.map(async (item) => {
              console.log(item, "item");

              // if(item){
              //   return ;
              // }

              const {
                mobile,
                images_per_service,
                number_of_service,
                map_address,
                mobile_number_sec,
                country_code_sec,
                have_whatsapp_sec,
                auto_accept_order,
                name,
                ar_name,
                logo,
                description,
                ar_description,
                open_time,
                close_time,
                contact_person_name,
                country_code,
                delivery_type,
                working_days,
                sub_category_id,
                email,
                password,
                address,
                ar_address,
                area,
                latitude,
                longitude,
                image,
                document,
                device_token,
                device_type,
                city_id,
                // country_id,
                associated_manager,
                service_id,
                eventtype_id,
                cover_photo,
                website_url,
                twitter_link,
                facebook_link,
                instagram_link,
              } = item;

              const form = ProviderProfile.findById(profile_id);

              let subCategoryId;
              if (sub_category_id) {
                const existingSubCategory = await SubCategory.findOne({
                  name: { $regex: new RegExp(sub_category_id, "i") },
                  is_delete: false,
                  is_active: true,
                  category_id: new mongoose.Types.ObjectId(category_id),
                });
                if (existingSubCategory) {
                  subCategoryId = existingSubCategory._id;
                } else {
                  const newCategory = await new SubCategory({
                    name: sub_category_id,
                    is_active: true,
                    category_id: category_id,
                    country_id: country_id,
                    added_by: "Admin",
                  }).save();
                  subCategoryId = newCategory._id;
                }
              }

              let eventTypeId;
              if (eventtype_id) {
                const existingSubCategory = await EventType.findOne({
                  name: { $regex: new RegExp(eventtype_id, "i") },
                  is_delete: false,
                  is_active: true,
                });
                if (existingSubCategory) {
                  eventTypeId = existingSubCategory._id;
                } else {
                  const newCategory = await new EventType({
                    name: eventtype_id,
                    is_active: true,
                    added_by: "Admin",
                  }).save();
                  eventTypeId = newCategory._id;
                }
              }

              let associatedManager;
              if (associated_manager) {
                const existingAssociate = await User.findOne({
                  name: { $regex: new RegExp(associated_manager, "i") },
                  is_delete: false,
                  is_active: true,
                  type: UserTypes.SUB_ADMIN,
                });
                if (existingAssociate) {
                  associatedManager = existingAssociate._id;
                } else {
                  const newAssociate = await new User({
                    name: associated_manager,
                    is_active: true,
                    country_id: country_id,
                    type: UserTypes.SUB_ADMIN,
                  }).save();
                  associatedManager = newAssociate._id;
                }
              }

              let services = [];

              if (service_id) {
                const serviceNames = service_id
                  .split(",")
                  .map((name) => name.trim());
                console.log("serviceNames", serviceNames);
                for (const serviceName of serviceNames) {
                  const existingService = await Serivces.findOne({
                    name: { $regex: new RegExp(serviceName, "i") },
                    is_delete: false,
                    is_active: true,
                  });

                  if (existingService) {
                    services.push(existingService._id);
                  } else {
                    const newService = await new Serivces({
                      name: serviceName,
                      is_active: true,
                      country_id: country_id,
                      category_id: category_id,
                      sub_category_id: subCategoryId,
                    }).save();
                    services.push(newService._id);
                  }
                }
              }

              let selectedCity;
              if (city_id) {
                const existingCity = await ServiceCity.findOne({
                  name: { $regex: new RegExp(city_id, "i") },
                  is_delete: false,
                  is_active: true,
                });
                if (existingCity) {
                  selectedCity = existingCity._id;
                } else {
                  const newAssociate = await new ServiceCity({
                    name: city_id,
                    is_active: true,
                    country: country_id,
                  }).save();
                  selectedCity = newAssociate._id;
                }
              }

              const data = await Provider.create({
                number_of_service,
                images_per_service,
                delivery_type,
                logo,
                auto_accept_order,
                name,
                ar_name,
                category_id,
                description,
                ar_description,
                open_time,
                close_time,
                contact_person_name,
                mobile_number: mobile,
                country_code,
                profile_id,
                eventtype_id: eventTypeId,
                email: email ? email.toLowerCase() : email,

                country_id,
                password: await Auth.encryptPassword("Test@123"),
                location:
                  longitude && latitude
                    ? {
                      type: "Point",
                      coordinates: [longitude, latitude],
                    }
                    : null,
                address,
                ar_address,
                area,
                latitude,
                longitude,
                image,
                document,
                device_token,
                device_type,
                is_verify: true,
                map_address,
                city_id: selectedCity,
                sub_category_id: subCategoryId,
                associated_manager: associatedManager,
                service_id: services,
                cover_photo,
                website_url,
                twitter_link,
                facebook_link,
                instagram_link,
              });

              const user = await User.create({
                name,
                ar_name,
                image: logo,
                mobile_number: mobile,
                country_code,
                email: email ? email.toLowerCase() : email,
                type: UserTypes.VENDOR,
                country_id,
                password: await Auth.encryptPassword("Test@123"),
                restaurant_id: data._id,
                is_verify: true,
                is_otp_verify: true,
                mobile_number_sec,
                country_code_sec,
                have_whatsapp_sec,
                city_id: selectedCity,
              });

              data.vendor_id = user._id;

              await data.save();

              if (working_days) {
                await Promise.all(
                  working_days.map(async (days) => {
                    const { day, time } = days;
                    const [open_time, close_time] = time;
                    console.log(open_time, close_time, day, "day11");
                    if (day && open_time && close_time) {
                      const isAlready = await AvailabilityProvider.findOne({
                        provider_id: data._id,
                        day,
                      });

                      if (isAlready) {
                        const updateData = await AvailabilityProvider.updateOne(
                          { provider_id: data._id, day, open_time, close_time }
                        );
                      } else {
                        const createData = await AvailabilityProvider.create({
                          provider_id: data._id,
                          day,
                          open_time,
                          close_time,
                        });
                      }
                    }
                  })
                );
              }
            })
          );

          return _RS.apiNew(
            res,
            true,
            "Provider Import Successfully",
            {},
            startTime
          );
        } catch (error) {
          console.log("Error:", error);
          next(error);
        }
      }
    );
  }

  public get() {
    this.router.get(
      "/",
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      [
        query("page")
          .notEmpty()
          .withMessage("Valid page number must be provided"),
        query("pageSize")
          .notEmpty()
          .withMessage("Valid page number must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          let sort: any = { created_at: -1 };

          let page = 1;
          let pageSize = 100;
          let year = new Date().getFullYear();

          const filter: any = {
            is_delete: false,
            //  ...req.filter
          }; //...req.filter

          if (req.query.search && req.query.search.trim()) {
            filter.$or = [
              {
                name: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
              {
                email: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
              {
                country_code: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
              {
                mobile_number: {
                  $regex: new RegExp(req.query.search),
                  $options: "i",
                },
              },
            ];
          }

          if (req.query.page) page = parseInt(req.query.page);
          if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

          // if (req.country_id) filter.country_id = new mongoose.Types.ObjectId(req.country_id);
          if (req.query.city_id)
            filter.city_id = new mongoose.Types.ObjectId(req.query.city_id);
          if (req.query.status)
            filter.is_active = req.query.status == "true" ? true : false;
          if (req.query.cases)
            filter.cases = req.query.cases == "true" ? true : false;

          if (req.query.year) {
            year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }

          if (req.query.month) {
            const month = parseInt(req.query.month);
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 1);
            filter.created_at = {
              $gte: startOfMonth,
              $lt: endOfMonth,
            };
          }

          if (
            req.query.start_date &&
            req.query.start_date !== "" &&
            req.query.end_date &&
            req.query.end_date !== ""
          ) {
            filter.created_at = {
              $gte: new Date(req.query.start_date + "T00:00:00Z"),
              $lte: new Date(req.query.end_date + "T23:59:59Z"),
            };
          } else {
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }

          const skipDocuments = (page - 1) * pageSize;
          let total = await Provider.countDocuments(filter);
          console.log(filter, "filter");

          const pipeline: any = [
            { $match: filter },
            {
              $lookup: {
                from: "categories",
                localField: "category_id",
                foreignField: "_id",
                as: "category_id",
              },
            },
            {
              $unwind: {
                path: "$category_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "subcategories",
                localField: "sub_category_id",
                foreignField: "_id",
                as: "sub_category_id",
              },
            },
            // {
            //   $unwind: {
            //     path: "$sub_category_id",
            //     preserveNullAndEmptyArrays: true
            //   }
            // },
            {
              $lookup: {
                from: "servicecountries",
                localField: "country_id",
                foreignField: "_id",
                as: "country_id",
              },
            },
            {
              $unwind: {
                path: "$country_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "servicecities",
                localField: "city_id",
                foreignField: "_id",
                as: "city_id",
              },
            },
            {
              $unwind: {
                path: "$city_id",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "serviceareas",
                localField: "area",
                foreignField: "_id",
                as: "area",
              },
            },
            {
              $unwind: {
                path: "$area",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "users",
                localField: "vendor_id",
                foreignField: "_id",
                as: "vendor_id",
              },
            },
            {
              $unwind: {
                path: "$vendor_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "associated_manager",
                foreignField: "_id",
                as: "associated_manager",
              },
            },
            {
              $unwind: {
                path: "$associated_manager",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "availabilityproviders",
                localField: "_id",
                foreignField: "provider_id",
                as: "working_days",
              },
            },
            { $sort: sort },
            {
              $skip: skipDocuments,
            },
            {
              $limit: pageSize,
            },
          ];

          const data = await Provider.aggregate(pipeline);

          return _RS.apiNew(
            res,
            true,
            "Provider list  get successfully",
            {
              data,
              total,
              page,
              pageSize,
            },
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.get(
      "/filters",
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      [],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = { is_delete: false, ...req.filter };

          if (req.country_id) filter.country_id = req.country_id;

          const data = await Provider.find({ ...filter }).select(
            "city_id country_id created_at"
          );

          const cityIds = [...new Set(data.map(({ city_id }: any) => city_id))];

          const [year, city] = await Promise.all([
            Helper.getYearAndMonth(data),
            ServiceCity.find({ _id: { $in: cityIds } }),
          ]);

          return _RS.apiNew(
            res,
            true,
            "Filter list  get successfully",
            {
              data: city,
              ...year,
            },
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.get(
      "/:id",
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      [param("id").notEmpty().withMessage("Valid  id must be provided")],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const filter: any = {
            is_delete: false,
            _id: new mongoose.Types.ObjectId(req.params.id),
          };

          const data = await Provider.aggregate([
            { $match: { ...filter } },

            {
              $lookup: {
                from: "availabilityproviders",
                localField: "_id",
                foreignField: "provider_id",
                as: "working_days",
              },
            },
            {
              $lookup: {
                from: "servicecities",
                localField: "city_id",
                foreignField: "_id",
                as: "city_id",
              },
            },
            {
              $unwind: {
                path: "$city_id",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "profiles",
                localField: "profile_id",
                foreignField: "_id",
                as: "profile_id",
              },
            },
            {
              $unwind: {
                path: "$profile_id",
                preserveNullAndEmptyArrays: true,
              },
            },
          ]);

          return _RS.apiNew(
            res,
            true,
            "Provider  get successfully",
            { data: data },
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.get(
      "/pending",
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      [
        query("page")
          .notEmpty()
          .withMessage("Valid page number must be provided"),
        query("pageSize")
          .notEmpty()
          .withMessage("Valid page number must be provided"),
      ],
      ValidateRequest,
      Authentication.userLanguage,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          let sort: any = { created_at: -1 };

          let page = 1;
          let pageSize = 100;
          let year = new Date().getFullYear();
          const statuses = [ApproveStatus.PENDING, ApproveStatus.REJECT];
          const filter: any = {
            is_delete: false,
            approve_status: { $in: statuses },
            ...req.filter,
          };

          if (req.query.page) page = parseInt(req.query.page);
          if (req.query.pageSize) pageSize = parseInt(req.query.pageSize);

          if (req.country_id)
            filter.country_id = new mongoose.Types.ObjectId(req.country_id);
          if (req.query.city_id)
            filter.city_id = new mongoose.Types.ObjectId(req.query.city_id);

          if (req.query.year) {
            year = parseInt(req.query.year);
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(year + 1, 0, 1);
            filter.created_at = {
              $gte: startOfYear,
              $lt: endOfYear,
            };
          }

          if (req.query.month) {
            const month = parseInt(req.query.month);
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 1);
            filter.created_at = {
              $gte: startOfMonth,
              $lt: endOfMonth,
            };
          }

          const skipDocuments = (page - 1) * pageSize;
          let total = await Provider.countDocuments(filter);
          console.log(filter, "filter");

          const pipeline: any = [
            { $match: filter },
            // {
            //   $lookup: {
            //     from: "categories",
            //     localField: "category_id",
            //     foreignField: "_id",
            //     as: "category_id",
            //   },
            // },
            // {
            //   $unwind: {
            //     path: "$category_id",
            //     preserveNullAndEmptyArrays: true
            //   }
            // },
            {
              $lookup: {
                from: "countries",
                localField: "country_id",
                foreignField: "_id",
                as: "country_id",
              },
            },
            {
              $unwind: {
                path: "$country_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "servicecities",
                localField: "city_id",
                foreignField: "_id",
                as: "city_id",
              },
            },
            {
              $unwind: {
                path: "$city_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "vendor_id",
                foreignField: "_id",
                as: "vendor_id",
              },
            },
            {
              $unwind: {
                path: "$vendor_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            { $sort: sort },
            {
              $skip: skipDocuments,
            },
            {
              $limit: pageSize,
            },
          ];

          const data = await Provider.aggregate(pipeline);

          return _RS.apiNew(
            res,
            true,
            "Provider list  get successfully",
            {
              data,
              total,
              page,
              pageSize,
            },
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );

    this.router.get(
      "/profile/:id",
      [
        param("id")
          .notEmpty()
          .withMessage("Valid category id must be provided"),
      ],
      ValidateRequest,
      Authentication.admin,
      checkPermission(Permissions.SERVICEPROVIDER),
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = {
            is_active: true,
            is_delete: false,
            category_id: new mongoose.Types.ObjectId(req.params.id),
          };

          let list = await ProviderProfile.find(filter).sort({
            created_at: -1,
          });
          console.log("list-----", list);
          return _RS.api(
            res,
            true,
            "Provider Profile list get successfully",
            list,
            startTime
          );
        } catch (error) {
          next(error);
        }
      }
    );
  }
}

export default new RestaurantRouter().router;
