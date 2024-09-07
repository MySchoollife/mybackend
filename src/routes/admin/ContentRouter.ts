import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import _RS from "../../helpers/ResponseHelper";
import Content from "../../models/Content";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import { UserTypes } from "../../models/User";
import { ChangeLogAction } from "../../models/ChangeLog";
import { changeLog } from "../../helpers/function";

class ContentRouter {
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
      checkPermission(Permissions.CMS),
      [
        body("content.*.name")
          .notEmpty()
          .isArray()
          .withMessage("Valid name must be provided"),
        body("content.*.ar_name")
          .notEmpty()
          .isArray()
          .withMessage("Valid ar_name must be provided"),
        body("content.*.description")
          .notEmpty()
          .isArray()
          .withMessage("Valid description must be provided"),
        body("content.*.ar_description")
          .notEmpty()
          .isArray()
          .withMessage("Valid ar_description must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { content } = req.body;

          await Promise.all(
            content.map(async (item) => {
              const { name, ar_name, description, ar_description } = item;
              await Content.create({
                name,
                ar_name,
                description,
                ar_description,
              });
            })
          );

          return _RS.apiNew(
            res,
            true,
            "Content added successfully",
            {},
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );

    this.router.put(
      "/",
      Authentication.admin,
      checkPermission(Permissions.CMS),
      [
        body("content.*.name")
          .notEmpty()
          .withMessage("Valid name must be provided"),
        body("content.*.ar_name")
          .notEmpty()
          .withMessage("Valid ar_name must be provided"),
        body("content.*.description")
          .notEmpty()
          .withMessage("Valid description must be provided"),
        body("content.*.ar_description")
          .notEmpty()
          .withMessage("Valid ar_description must be provided"),
        body("content.*.id")
          .notEmpty()
          .withMessage("Valid name must be provided"),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const { content } = req.body;

          await Promise.all(
            content.map(async (item) => {
              const { name, ar_name, description, ar_description, id } = item;
              const choice = await Content.findById(id);

              if (!choice) return;

              choice.name = name ? name : choice.name;
              choice.ar_name = ar_name ? ar_name : choice.ar_name;
              choice.description = description
                ? description
                : choice.description;
              choice.ar_description = ar_description
                ? ar_description
                : choice.ar_description;

              await choice.save();
            })
          );

          return _RS.apiNew(
            res,
            true,
            "Content updated successfully",
            {},
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );

    this.router.put(
      "/:id/status",
      Authentication.admin,
      checkPermission(Permissions.CMS),
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

          const choice = await Content.findById(id);

          if (!choice) {
            return _RS.apiNew(res, false, "Content not found", {}, startTime);
          }

          choice.is_active = !choice.is_active;

          await choice.save();

          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.STATUS,
              `Changed Status Content ${choice?.name}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Content status changed successfully",
            choice,
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
      checkPermission(Permissions.CMS),
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

          const user = await Content.findById(id);

          if (!user) {
            return _RS.apiNew(res, false, "Content not found", {}, startTime);
          }

          user.is_delete = true;

          await user.save();

          if (req.user.type == UserTypes.TEACHER) {
            await changeLog(
              ChangeLogAction.DELETE,
              `Deleted Content ${user?.name}.`,
              req.user.id
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Content deleted successfully",
            user,
            startTime
          );
        } catch (error) {
          console.log("Error :", error);

          next(error);
        }
      }
    );
  }

  public get() {
    this.router.get(
      "/",
      Authentication.admin,
      checkPermission(Permissions.CMS),
      [
        // query('page').notEmpty().withMessage('Valid page number must be provided'),
        // query('pageSize').notEmpty().withMessage('Valid page number must be provided'),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          // const filter: any = { is_delete: false }

          const data = await Content.find().sort({ created_at: -1 });

          return _RS.apiNew(
            res,
            true,
            "Content retrieved successfully",
            {
              data,
            },
            startTime
          );
        } catch (error) {
          console.error("Error:", error);
          next(error);
        }
      }
    );
  }
}

export default new ContentRouter().router;
