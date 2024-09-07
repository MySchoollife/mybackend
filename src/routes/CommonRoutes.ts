import axios from "axios";
import { Router } from "express";
import * as mongoose from "mongoose";

import Authentication from "../Middlewares/Authnetication";
import ValidateRequest from "../Middlewares/ValidateRequest";
import { body, param, query } from "express-validator";
import UploadFiles from "../Middlewares/FileUploadMiddleware";

import { CommonController } from "../controllers/CommonController";
import _RS from "../helpers/ResponseHelper";
import Class from "../models/Class";
import Source, { SourceTypes } from "../models/Source";
import Status from "../models/Status";
import Section from "../models/Section";

const collationOptions = {
  locale: "en",
  strength: 2,
};

class CommonRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.post();
    this.get();
  }

  public post() {
    this.router.post(
      "/image-upload",
      UploadFiles.upload,
      CommonController.uploadImage
    );
    this.router.post(
      "/file-upload",
      UploadFiles.upload,
      CommonController.uploadFile
    );
  }

  public get() {
    this.router.get("/class", [], ValidateRequest, async (req, res, next) => {
      try {
        const startTime = new Date().getTime();

        const filter: any = {
          is_active: true,
          is_delete: false,
        };

        let list = await Class.find(filter).sort({
          order_number: -1,
          created_at: -1,
        });
        return _RS.api(
          res,
          true,
          "All Class list get successfully",
          list,
          startTime
        );
      } catch (error) {
        next(error);
      }
    });

    this.router.get(
      "/lead-source",
      [],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = {
            is_active: true,
            is_delete: false,
            type: SourceTypes.LEAD,
          };

          let list = await Source.find(filter).sort({
            created_at: -1,
          });
          return _RS.api(
            res,
            true,
            "All Lead Source list get successfully",
            list,
            startTime
          );
        } catch (error) {
          next(error);
        }
      }
    );

    this.router.get(
      "/lead-status",
      [],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = {
            is_active: true,
            is_delete: false,
            type: SourceTypes.LEAD,
          };

          let list = await Status.find(filter).sort({
            created_at: -1,
          });
          return _RS.api(
            res,
            true,
            "All Lead status list get successfully",
            list,
            startTime
          );
        } catch (error) {
          next(error);
        }
      }
    );

    this.router.get(
      "/class-section",
      [],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();

          const filter: any = {
            is_active: true,
            is_delete: false,
          };

          let list = await Section.find(filter).sort({
            created_at: -1,
          });
          return _RS.api(
            res,
            true,
            "All class section list get successfully",
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

export default new CommonRoutes().router;
