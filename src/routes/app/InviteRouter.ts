import * as mongoose from "mongoose";
import { Router } from "express";
import Authentication from "../../Middlewares/Authnetication";
import Invite from "../../models/Invite";
import _RS from "../../helpers/ResponseHelper";
import { body, param, query } from "express-validator";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import EmailTemplate from "../../models/EmailTemplate";
import User, { UserTypes } from "../../models/User";
import MailHelper from "../../helpers/MailHelper";

class InviteRouter {
  public router: Router;

  constructor() {
    this.router = Router();
    this.get();
    this.post();
  }

  public post() {
    this.router.post(
      "/",
      Authentication.user,
      [
        body("email").notEmpty().withMessage("Email must be required"),
        body("mobile_number").notEmpty().withMessage("mobile_number must be required"),
        body("country_code").notEmpty().withMessage("country_code must be required")

      ],
      ValidateRequest,
      async (req, res, next) => {
        try {
          const startTime = new Date().getTime();
          let { email, mobile_number, country_code  } = req.body;
          const user_id = new mongoose.Types.ObjectId(req.user.id);
         email = email ? email.toLowerCase() : email;

          let isAlreadyInvited = await Invite.findOne({ user_id: user_id,email : email, });
   
          if(isAlreadyInvited){
              return _RS.apiNew(res,false,"Already Invited User this email",{},startTime);
          }

          isAlreadyInvited = await Invite.findOne({ user_id: user_id,mobile_number : mobile_number,country_code : country_code });
          if(isAlreadyInvited){
            return _RS.apiNew(res,false,"Already Invited User this mobile number",{},startTime);
        }

        let isAlreadyexist = await User.findOne({ _id : user_id, email : email,  type : UserTypes.CUSTOMER});
   
        if(isAlreadyexist){
            return _RS.apiNew(res,false,"Already exists User this email",{},startTime);
        }

        isAlreadyexist = await User.findOne({ _id : user_id, mobile_number : mobile_number,country_code : country_code ,type : UserTypes.CUSTOMER});
        if(isAlreadyexist){
          return _RS.apiNew(res,false,"Already exists User this mobile number",{},startTime);
      }

          const create = await  Invite.create({
             user_id: req.user.id,
             email : email,
             country_code : country_code,
             mobile_number : mobile_number
          });


          const user = await User.findById(user_id)
   
          const emailTemplate = await EmailTemplate.findOne({
            slug: "invite-friend",
          });
          console.log("emailTemplate", emailTemplate)

          if (emailTemplate) {
            var replacedHTML = emailTemplate.description;
            replacedHTML = replacedHTML.replace("[NAME]", user?.email || "");
            replacedHTML = replacedHTML.replace("[INVITE_LINK]", "http://153.92.4.13:7902/");
            replacedHTML = replacedHTML.replace("[SENDER_NAME]", user.name || "");

            var replacedArHTML = emailTemplate?.ar_description;
            replacedArHTML = replacedArHTML?.replace("[NAME]", user?.email || "");
            replacedArHTML = replacedArHTML?.replace("[INVITE_LINK]", "http://153.92.4.13:7902/");
            replacedArHTML = replacedArHTML?.replace("[SENDER_NAME]", user.name || "");

            await MailHelper.sendMail(
              email,
              emailTemplate.subject,
              replacedHTML,
              replacedArHTML
            );
          }

          return _RS.apiNew(
            res,
            true,
            "Invited successfully",
            create,
            startTime
          );
        } catch (err) {
          next(err);
        }
      }
    );
  }

  public get(){}
}

export default new InviteRouter().router;
