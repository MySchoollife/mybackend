import User from "../models/User";
const nodemailer = require("nodemailer");

export class MailHelper {

  constructor() { }

  static emailHtml(description: any, ar_description: any) {
    console.log(process.env.BASE_URL + `img/Logo.png`);

   


    const html = `
    <html lang="en">
        <body style="font-family: 'Lato', 'Merriweather', 'Roboto', sans-serif;">
            <div className="mainEmailWraper" style="max-width: 100%; margin: 0 auto;">
                <div className="emailHeader" style="background-color:#383B42;border-radius: 8px 8px 0 0;">
                    <div className="logoOuter" style="text-align:center;">
                    <img style="width: 80px; " src="https://b2btobacco.s3.amazonaws.com/planit/profile/PLANIT_1713431138741.png" alt="Logo"   />
                    </div>
                </div>
        
                <div className="emailTempBody" style="">
                    <div style="padding: 16px; background-color: #fff; gap: 16px;">  
                    <table style="display: flex; align-items: start;width: 100%;margin: 0 auto;"> 
                    <tbody> 
                    <tr>   
                    <td valign="top" style="border: 0;padding: 10px; font-family: sans-serif;max-width: 48%;">
                           ${description}  
                         </td> 

                         <td valign="top" style="width:48%;border: 0;padding: 10px; font-family: sans-serif; direction: rtl;"> 
                           ${ar_description}  
                         </td>
                         </tr>
                         </tobdy>
                      </table>

                    </div>
                </div>
                
                <table style=" background-color:#383B42;width: 100%; color: #FFF; background-image: url(https://b2btobacco.s3.amazonaws.com/planit/category/PLANIT_1714367822073.jpg);background-repeat: no-repeat; background-size: contain;">
                    <tr style="vertical-align: baseline;">
                        <td style="width:30%">
                            <div style="padding: 16px;font-size: 14px; text-align: right;">
                              <div style="font-size: 16px; font-weight: 600; "> بلانيت</div>
                             
                              <div style="font-size: 14px; font-weight: 400; color: #0089B6;">
                              <a href="mailto:support@tawasi.online" style="text-decoration: none; color: #fff; font-size: 16px;">support@planit.online</a>
                              <p style=" color: #fff; font-size: 16px;margin: 5px;">+970 2 12 2020 94</p>
                              <p style=" color: #fff; font-size: 16px;margin: 5px;">بلانيت </p>
                              </div>
                              <ul style="list-style: none; padding: 0; margin: 0; margin-top: 16px; text-center "> 
                                <li style="display: inline-block; margin:0 8px;">
                                  <a href="https://www.facebook.com" style="display: flex; width: 40px; height: 40px; border-radius: 50px; background:linear-gradient(359deg, #CE9944 2.32%, #FFE1A8 179.84%) !important; position:relative;">
                                  <img  src="https://tawasi-s3.s3.amazonaws.com/tawasi/category/TAWASI_1711617077529.png" alt="Logo" style="margin:auto;position: absolute; left:0px; right: 0px; bottom:0px; top:0px; width: 17px;" />  
                                  </a>
                                </li>
                                <li style="display: inline-block; margin:0 8px;">
                                  <a href="https://www.youtube.com" style="display: flex; width: 40px; height: 40px; border-radius: 50px; background:linear-gradient(359deg, #CE9944 2.32%, #FFE1A8 179.84%) !important; position:relative;">
                                     <img  src="https://tawasi-s3.s3.amazonaws.com/tawasi/category/TAWASI_1711617152517.png" alt="Logo" style="margin:auto;position: absolute; left:0px; right: 0px; bottom:0px; top:0px; width: 17px;" />
                                  </a>
                                </li>
                                <li style="display: inline-block; margin:0 8px;">
                                  <a href="https://www.tiktok.com" style="display: flex; width: 40px; height: 40px; border-radius: 50px; background:linear-gradient(359deg, #CE9944 2.32%, #FFE1A8 179.84%) !important; position:relative;">
                                  <img  src="https://tawasi-s3.s3.amazonaws.com/tawasi/category/TAWASI_1711617185262.png" alt="Logo" style="margin:auto;position: absolute; left:0px; right: 0px; bottom:0px; top:0px; width: 17px;" />            
                                  </a>
                                </li>
                                <li style="display: inline-block; margin:0 8px;">
                                  <a href="https://www.instagram.com" style="display: flex; width: 40px; height: 40px; border-radius: 50px; background:linear-gradient(359deg, #CE9944 2.32%, #FFE1A8 179.84%) !important; position:relative;">
                                  <img  src="https://tawasi-s3.s3.amazonaws.com/tawasi/category/TAWASI_1711617118790.png" alt="Logo" style="margin:auto;position: absolute; left:0px; right: 0px; bottom:0px; top:0px; width: 17px;" />  
                                  </a>
                                </li>
                                
                              </ul>
                            </div>
                        </td>
                        <td>
                            <div style="text-align: right;padding: 16px;font-size: 14px;">
                                <div style="font-size: 16px; font-weight: 600; ">مهمتنا</div>
                                <p>تتوفير تجربة توصيل مريحة وسلسة للعملاء مع تمكين الموردين المحليين ووكلاء التوصيل في العملية </p>
                            </div>
                        </td>
                        <td>
                             <div style="text-align: right;padding: 16px;font-size: 14px;">
                                <div style="font-size: 16px; font-weight: 600; ">رؤيتنا </div>
                                <p>
                                لتصبح المنصة الرائدة في والمعترف بها بسبب التزامنا برضا العملاء للتوصيل في فلسطين.
                                    </p>
                            </div>
                        </td>
                    </tr>
                </table>
                <div className="emailFooter" style="padding: 16px; background-color:#181818; border-radius: 0 0 8px 8px; text-align: center;">
                    <div className="title" style="font-size: 14px; color: #fff; font-weight: 500;">Copyright © 2024 Planit. All rights reserved.</div>
                </div>
            </div>
        </body>
    </html>`
    return html;
  }

  static async sendMail(receiver_mail: any, subject: any, html: any, arHtml?: any) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USERNAME ?? 'harshit.inventcolab@gmail.com',
        pass: process.env.MAIL_PASSWORD ?? 'xggpvgdhddkzyecb',
      },
    });

    let mailOptions = {
      from: process.env.MAIL_USERNAME ?? 'harshit.inventcolab@gmail.com',
      to: receiver_mail,
      subject: subject,
      html: MailHelper.emailHtml(html, arHtml),
    };


    // Send the email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error("Error while sending an email : ", error);
        return false;
      } else {
        console.log("An email has been sent successfully : ", info.response);
        return true;
      }
    });
  }
  // static async sendMail(receiver_mail: any, subject: any, html: any, arHtml?: any) {
  //   const transporter = nodemailer.createTransport({
  //     service: "gmail",
  //     auth: {
  //       user: process.env.MAIL_USERNAME,
  //       pass: process.env.MAIL_PASSWORD,
  //     },
  //   });

  //   let mailOptions = {
  //     from: process.env.MAIL_USERNAME,
  //     to: receiver_mail,
  //     subject: subject,
  //     html: MailHelper.emailHtml(html, arHtml),
  //   };


  //   // Send the email
  //   transporter.sendMail(mailOptions, function (error, info) {
  //     if (error) {
  //       console.error("Error while sending an email : ", error);
  //       return false;
  //     } else {
  //       console.log("An email has been sent successfully : ", info.response);
  //       return true;
  //     }
  //   });
  // }
}

export default MailHelper;
