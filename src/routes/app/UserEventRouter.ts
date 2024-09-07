import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import { body, param, query } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { UserEventController } from "../../controllers/App/UserEventController";
import _RS from "../../helpers/ResponseHelper"
import UserEvent from "../../models/UserEvent";


class UserEventRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
  }

  public post() {
    this.router.post("/", 
      Authentication.user,
      [
        body('event_id').notEmpty().withMessage('Valid event type must be provided'),
        body('budget').notEmpty().withMessage('Valid budget must be provided'),
        body('date').notEmpty().withMessage('Valid date must be provided'),
      ],
      ValidateRequest,
      UserEventController.addEvent
    );

    this.router.put("/:id",
      Authentication.user,
      [
        param('id').notEmpty().isMongoId().withMessage('Valid event Id must be provided'),
        body('event_id').notEmpty().withMessage('Valid event type must be provided'),
        body('budget').notEmpty().withMessage('Valid budget must be provided'),
        body('date').notEmpty().withMessage('Valid date must be provided'),
      ],
      ValidateRequest,
      UserEventController.editEvent
    );
  }

  public delete() {
    this.router.delete("/:id",
      Authentication.user,
      [
        param('id').notEmpty().isMongoId().withMessage('Valid user event id must be provided'),
      ],
      ValidateRequest,
      UserEventController.statusChange
    );
  }

  public get() {
    this.router.get("/", Authentication.user,
      [
        param('id').notEmpty().isMongoId().withMessage('Valid User Id must be provided'),
        query('page').optional().notEmpty().withMessage('Valid page number must be provided'),
        query('pageSize').optional().notEmpty().withMessage('Valid page size must be provided'),
      ],
      ValidateRequest,
      UserEventController.list
    );
  }
}

export default new UserEventRouter().router;
