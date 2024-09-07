import _RS from "../helpers/ResponseHelper";
import { env } from "../environments/Env";
import Content from "../models/Content";
import { FileUpload } from "../helpers/FileUpload";
import AppSetting from "../models/AppSetting";

import Service from "../models/Serivces";
import Banner from "../models/Banner";

export class CommonController {
  /** API for category only for admin */

  /**
   * @api {post} /api/common/image-upload Image Upload
   * @apiVersion 1.0.0
   * @apiName Image Upload
   * @apiGroup Masters
   * @apiParam {File} image Image.
   * @apiParam {String} type Type (Ex.Profile, Type can be which image you are uploading).
   */

  static async uploadImage(req, res, next) {
    try {
      const { image } = req.body.files;
      let path: any = "planit";
      const upload = await FileUpload.uploadInS3(image, path);
      return _RS.ok(
        res,
        "SUCCESS",
        "Image Uploaded",
        `https://sugamaya.s3.amazonaws.com/${upload}`,
        new Date().getTime()
      );
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * @api {post} /api/common/file-upload File Upload
   * @apiVersion 1.0.0
   * @apiName File Upload
   * @apiGroup Masters
   * @apiParam {File} file Document file.
   * @apiParam {String} type Type (Ex.Document, Type can be which file you are uploading).
   */

  static async uploadFile(req, res, next) {
    try {
      const startTime = new Date().getTime();
      const { file } = req.body.files;
      const { type } = req.body;
      let path: any = "planit/" + type;

      const upload = await FileUpload.uploadFileInS3(file, path);
      console.log(upload, "upload", env().s3Url);

      return _RS.api(
        res,
        true,
        "File Uploaded Successfully",
        { upload: env().s3Url + upload },
        startTime
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * @api {get} /api/common/app-setting App Setting
   * @apiVersion 1.0.0
   * @apiName App Setting
   * @apiGroup Masters
   */

  static async appSetting(req, res, next) {
    try {
      const startTime = new Date().getTime();
      const getAppSetting = await AppSetting.findById(
        "64cb2e4e865bceaa113a6139"
      );
      return _RS.api(
        res,
        true,
        "App setting get successfully",
        getAppSetting,
        startTime
      );
    } catch (error) {
      next(error);
    }
  }
}
