import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import { DashboardController } from "../../controllers/Admin/DashboardController";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import checkPermission, { Permissions } from "../../Middlewares/Permisssion";
import { getUser } from "../../helpers/calculate";
import _RS from "../../helpers/ResponseHelper";

class DashboardRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
    this.put();
  }

  public post() {}
  public get() {
    //checkPermission('Dashboard:view')
    this.router.get(
      "/",
      Authentication.admin,
      checkPermission(Permissions.DASHBOARD),
      DashboardController.dashboardData
    );





    this.router.get(
      "/graph",
      Authentication.admin,
      [
        query("period")
          .optional()
          .notEmpty()
          .isIn(["quarterly", "monthly", "weekly"])
          .withMessage("Valid  period be provided"),
        query("year")
          .optional()
          .notEmpty()
          .withMessage("Valid year be provided"),
      ],
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          let year = new Date().getFullYear();
          let period = "monthly";

          if (req.query.year) year = parseInt(req.query.year);
          if (req.query.period) period = req.query.period;

          const {
            user,
            activeUser,
            provider,
            categories,
            events,
            services,
            quotation,
            pendingQuotation,
            supportCases,
            accPerformance,
            Onboardings,
            visitors,
          } = await getUser({
            interval: period,
            year,
          });

          return _RS.api(
            res,
            true,
            "Chart Data Get Successfully ",
            {
              user,
              activeUser,
              provider,
              categories,
              events,
              services,
              quotation,
              pendingQuotation,
              supportCases,
              accPerformance,
              Onboardings,
              visitors,
            },
            startTime
          );
        } catch (error) {
          next(error);
        }
      }
    );
  }
  public put() {}
}

export default new DashboardRouter().router;
