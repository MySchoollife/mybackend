import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import { EmailTemplateController } from "../../controllers/Admin/EmailTemplateController";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
class EmailTemplateRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
  }

  public post() {
    this.router.post("/add-edit/:id?", Authentication.admin, checkPermission(Permissions.EMAIL), EmailTemplateController.addEdit);
  }

  public get() {
    this.router.get("/list", Authentication.admin, checkPermission(Permissions.EMAIL), EmailTemplateController.list);
    this.router.get("/status/:id", Authentication.admin, checkPermission(Permissions.EMAIL), EmailTemplateController.statusChange);
    this.router.get("/view/:id", Authentication.admin, checkPermission(Permissions.EMAIL), EmailTemplateController.view);
  }
}

export default new EmailTemplateRouter().router;
