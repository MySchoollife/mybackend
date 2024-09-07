import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import { EventTypeController } from "../../controllers/Admin/EventTypeController";

import { body, param } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";

class EventTypeRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
  }

  public post() {
    this.router.post("/", Authentication.admin,
      checkPermission(Permissions.EVENTTYPE),
      [
        body('image').notEmpty().withMessage('Valid image must be provided'),
        body('name').notEmpty().withMessage('Valid name must be provided'),
        body('ar_name').notEmpty().withMessage('Valid ar_name must be provided'),
        body('is_active').notEmpty().withMessage('Valid is_active must be provided'),
        body('is_featured').optional().notEmpty().withMessage('Valid featured must be provided'),
      ],
      ValidateRequest, EventTypeController.add);

    this.router.put("/:id", Authentication.admin,
      checkPermission(Permissions.EVENTTYPE),
      [
        body('image').optional().notEmpty().withMessage('Valid image must be provided'),
        body('name').notEmpty().withMessage('Valid name must be provided'),
        body('ar_name').notEmpty().withMessage('Valid ar_name must be provided'),
        body('is_active').notEmpty().withMessage('Valid is_active must be provided'),
        body('is_featured').optional().notEmpty().withMessage('Valid featured must be provided'),
      ],
      ValidateRequest, EventTypeController.edit);

    this.router.post("/import-file/:type", Authentication.admin, EventTypeController.importFile);
  }

  public get() {
    this.router.get("/", Authentication.admin, checkPermission(Permissions.EVENTTYPE), EventTypeController.list);

    this.router.get("/status/:id", Authentication.admin, checkPermission(Permissions.EVENTTYPE), EventTypeController.statusChange);

    this.router.delete("/:id",
      Authentication.admin,
      checkPermission(Permissions.EVENTTYPE),
      [
        param('id').notEmpty().isMongoId().withMessage('Valid Event Type id must be provided'),
      ],
      ValidateRequest, EventTypeController.deleteEvent);


    this.router.post("/delete-all",
      Authentication.admin,
      checkPermission(Permissions.EVENTTYPE),
      [
        body('ids').notEmpty().isArray().withMessage('Valid Event Type ids must be provided'),
      ],
      ValidateRequest, EventTypeController.deleteAll);
  }
}

export default new EventTypeRouter().router;
