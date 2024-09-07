import { Router } from "express";

import CommonRoutes from "./CommonRoutes";
import ActivityLogRouter from "./admin/ActivityLogRouter";
import AuthRouter from "./admin/AuthRouter";
import BannerRouter from "./admin/BannerRouter";

import CommonRouter from "./admin/CommonRouter";
import ContentRouter from "./admin/ContentRouter";
import StudentRouter from "./admin/StudentRouter";
import DashbordRouter from "./admin/DashbordRouter";
import EmailTemplateRouter from "./admin/EmailTemplateRouter";
import NotificationRouter from "./admin/NotificationRouter";
import TeacherRouter from "./admin/TeacherRouter";

import AuthRoutes from "./app/AuthRoutes";

import ChangeLogRouter from "./admin/ChangeLogRouter";
import LeadRouter from "./admin/LeadRouter";
import SourceRouter from "./admin/SourceRouter";
import StatusRouter from "./admin/StatusRouter";
import ClassRouter from "./admin/ClassRouter";
import SectionRouter from "./admin/SectionRouter";

class Routes {
  public router: Router;
  constructor() {
    this.router = Router();
    this.app();
    this.admin();
    this.common();
  }

  app() {
    this.router.use("/app/auth", AuthRoutes);
  }

  admin() {
    this.router.use("/admin/auth", AuthRouter);
    this.router.use("/admin/dashboard", DashbordRouter);
    this.router.use("/admin/student", StudentRouter);
    this.router.use("/admin/teacher", TeacherRouter);
    this.router.use("/admin/banner", BannerRouter);
    this.router.use("/admin/content", ContentRouter);
    this.router.use("/admin/email-template", EmailTemplateRouter);

    this.router.use("/admin/common", CommonRouter);
    this.router.use("/admin/notification", NotificationRouter);
    this.router.use("/admin/activity-log", ActivityLogRouter);

    this.router.use("/admin/change-log", ChangeLogRouter);
    this.router.use("/admin/source", SourceRouter);
    this.router.use("/admin/status", StatusRouter);
    this.router.use("/admin/class", ClassRouter);
    this.router.use("/admin/section", SectionRouter);
    this.router.use("/admin/lead", LeadRouter);
  }

  common() {
    this.router.use("/common", CommonRoutes);
  }
}
export default new Routes().router;
