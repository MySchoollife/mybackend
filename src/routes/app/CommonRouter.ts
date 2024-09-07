import * as mongoose from "mongoose";
import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import Category from "../../models/Category";
import SubCategory from "../../models/SubCategory";
import _RS from "../../helpers/ResponseHelper";
import { body, param, query } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import EventType from "../../models/EventType";
import Attribute from "../../models/Attribute";
import EmailTemplate from "../../models/EmailTemplate";
import MailHelper from "../../helpers/MailHelper";


class CommonRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.get();
  }





  public get() {

    this.router.post(
      "/subscribe", async (req, res, next) => {
        const startTime = new Date().getTime();
        const { email } = req.body;
        try {

         
          if (email) {

            const emailTemplate = await EmailTemplate.findOne({
              slug: "subscribe",
            });
            console.log("emailTemplate", emailTemplate)
  
            if (emailTemplate) {
              let text = `Hello and welcome! Your journey toward building your dream begins here. 🛠️

              By subscribing to the Planit, you can expect a regular stream of expert-backed insights, tactical advice, and success stories to inspire and push you towards your entrepreneurial goals.
              
              We'd like to learn more about what content to send you so you get the advice you need.`

              var replacedHTML = emailTemplate.description;
              replacedHTML = replacedHTML.replace("[NAME]", email|| "");
              replacedHTML = replacedHTML.replace("[TEXT]", text || "");
  
              var replacedArHTML = emailTemplate?.ar_description;
              replacedArHTML = replacedArHTML?.replace("[NAME]", email || "");
              replacedArHTML = replacedArHTML?.replace("[TEXT]", text || "");


          
  
              await MailHelper.sendMail(
                email,
                emailTemplate.subject,
                replacedHTML,
                replacedArHTML
              );
            }
  

          } else {
            return _RS.apiNew(
              res,
              false,
              "Please Provide a valid email address",
              {},
              startTime
            );
          }
          return _RS.apiNew(
            res,
            true,
            "Thank you for subscription!",
            {},
            startTime
          );

        } catch (error) {
          next(error);
        }
      }
    )



    this.router.get("/event-type", [],
      ValidateRequest, async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const filter: any = { is_active: true, is_delete: false }
          const country_id = req.query.country_id
          if (country_id) {
            filter.country_id = (country_id)
          }



          let list = await EventType.find(filter).sort({ created_at: -1 });
          console.log("list-----", list)

          return _RS.api(res, true, "Event Type list get successfully", list, startTime);
        } catch (error) {
          next(error);
        }
      });

    this.router.get("/attribute/:category_id/:service_id",
      [
        param('category_id').notEmpty().withMessage('Valid Category Id must be provided'),
        param('service_id').notEmpty().withMessage('Valid Service Id must be provided'),
      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          const country_id = req.query.country_id
          const filter: any = {
            is_active: true, is_delete: false,
            category_id: new mongoose.Types.ObjectId(req.params.category_id),
            service_id: new mongoose.Types.ObjectId(req.params.service_id),
          }
          if (country_id) {
            filter.country_id = (country_id)
          }

          let list = await Attribute.find(filter).sort({ created_at: -1 });
          console.log("list-----", list)

          return _RS.api(res, true, "Attribute list get successfully", list, startTime);
        } catch (error) {
          next(error);
        }
      });



  }
}

export default new CommonRouter().router;
