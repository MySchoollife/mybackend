import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import { SubCategoryController } from "../../controllers/Admin/SubCategoryController";

import { body, param } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";

class SubCategoryRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
  }

  public post() {
    this.router.post("/", Authentication.admin,
      checkPermission(Permissions.SUBCATEGORY),
      [
        body('image').notEmpty().withMessage('Valid image must be provided'),
        body('name').notEmpty().withMessage('Valid name must be provided'),
        body('ar_name').notEmpty().withMessage('Valid ar_name must be provided'),
        body('is_active').notEmpty().withMessage('Valid is_active must be provided'),
        body('category_id').notEmpty().withMessage('Valid Category  must be provided'),
      ],
      ValidateRequest, SubCategoryController.add);

    this.router.put("/:id", Authentication.admin,
      checkPermission(Permissions.SUBCATEGORY),
      [
        body('image').optional().notEmpty().withMessage('Valid image must be provided'),
        body('name').notEmpty().withMessage('Valid name must be provided'),
        body('ar_name').notEmpty().withMessage('Valid ar_name must be provided'),
        body('is_active').notEmpty().withMessage('Valid is_active must be provided'),
        body('category_id').notEmpty().withMessage('Valid Category  must be provided'),
      ],
      ValidateRequest, SubCategoryController.edit);

    this.router.post("/import-file/:type", Authentication.admin, SubCategoryController.importFile);
  }

  public get() {
    this.router.get("/", Authentication.admin, checkPermission(Permissions.SUBCATEGORY), SubCategoryController.list);

    this.router.get("/status/:id", Authentication.admin, checkPermission(Permissions.SUBCATEGORY), SubCategoryController.statusChange);

    this.router.delete("/:id",
      Authentication.admin,
      checkPermission(Permissions.SUBCATEGORY),
      [
        param('id').notEmpty().isMongoId().withMessage('Valid Sub category id must be provided'),
      ],
      ValidateRequest, SubCategoryController.deleteCategory);


    this.router.post("/delete-all",
      Authentication.admin,
      checkPermission(Permissions.SUBCATEGORY),
      [
        body('ids').notEmpty().isArray().withMessage('Valid Sub category ids must be provided'),
      ],
      ValidateRequest, SubCategoryController.deleteAll);
  }
}

export default new SubCategoryRouter().router;
