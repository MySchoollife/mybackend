import formidable = require("formidable");

export class UploadFiles {
  static upload(req: any, res: any, next: any) {
    try {
      const form = formidable({ multiples: true });
      form.parse(req, (err, fields = {}, files) => {
        if (err) {
          next(err);
          return;
        }
        req.body = { ...fields, files };
        next();
      });
    } catch (error) {
      req.errorStatus = 401; // 401 Unprocessable Entity
      next(error);
    }
  }
}

export default UploadFiles;
