import { S3 } from "aws-sdk";
import { env } from "../environments/Env";
import * as path from "path";
import * as os from "os";
import AWS = require("aws-sdk");
import * as fs from "fs";
import Helper from "./Helper";

AWS.config.update({
  accessKeyId: env().awsAccessKey,
  secretAccessKey: env().awsSecretKey,
  region: env().region,
});

export class FileUpload {
  constructor() {}

  static s3 = new AWS.S3();

  static uploadInS3(image, path) {
    let folderPath = path;
    let fileExtension = '.png';
    const imageRemoteName = `${folderPath}/image_${new Date().getTime()}${fileExtension}`;
    console.log(imageRemoteName , "imageRemoteName...");
    return FileUpload.s3
      .putObject({
        Bucket: env().s3Bucket,
        Body: fs.readFileSync(image.filepath),
        ContentType: image.type,
        Key: imageRemoteName,
      })
      .promise()
      .then((response) => {
        console.log(response,"response....");
        return imageRemoteName;
      })
      .catch((err) => {
        console.log("failed:", err);
        return false;
      });
  } 

  static async uploadFileInS3(file, path) {

    let folderPath = path;
    const extension = await Helper.getFileExtension(file.originalFilename)

    const imageRemoteName = `${folderPath}/file_${new Date().getTime()}.${extension}`; 
    
    return FileUpload.s3
      .putObject({
        Bucket: env().s3Bucket,
        Body: fs.readFileSync(file.filepath),
        ContentType: file.mimetype,
        Key: imageRemoteName,
      })
      .promise()
      .then((response) => {
        console.log(response);
        return imageRemoteName;
      })
      .catch((err) => {
        console.log("failed:", err);
        return false;
      });
  }

  static deleteFromS3(path) {
    const params = {
      Bucket: env().s3Bucket,
      Delete: {
        Objects: [
          {
            Key: path,
          },
        ],
      },
    };
    return FileUpload.s3
      .deleteObjects(params)
      .promise()
      .then((response) => {
        console.log("Deleted success", response);
        return true;
      })
      .catch((error) => {
        console.log("failed:", error);
        return false;
      });
  }
}

export default FileUpload;
