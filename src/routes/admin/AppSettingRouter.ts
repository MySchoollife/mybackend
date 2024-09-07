import { Router } from "express";
import { body } from "express-validator";

import Authentication from "../../Middlewares/Authnetication";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import _RS from "../../helpers/ResponseHelper";
import AppSetting from "../../models/AppSetting";

class AppSettingRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.post();
        this.get();
    }

    public post() {
        this.router.post(
            "/",
            Authentication.admin,
            [
                body("app_store_url").optional().isString().withMessage("Valid app store URL must be provided"),
                body("play_store_url").optional().isString().withMessage("Valid play store URL must be provided"),
                body("android_version").optional().isString().withMessage("Valid Android version must be provided"),
                body("ios_version").optional().isString().withMessage("Valid Ios version must be provided"),
                body("android_share_content").optional().isString().withMessage("Valid android_share_content must be provided"),
                body("ios_share_content").optional().isString().withMessage("Valid ios_share_content must be provided"),
                body("facebook").optional().isString().withMessage("Valid facebook must be provided"),
                body("instagram").optional().isString().withMessage("Valid instagram must be provided"),
                body("support_number").optional().isString().withMessage("Valid support_number must be provided"),
                body("support_email").optional().isString().withMessage("Valid support_email must be provided"),
            ],
            ValidateRequest,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    // Destructure the relevant fields from the request body
                    const {
                        app_store_url,
                        play_store_url,
                        android_version,
                        ios_version,
                        android_share_content,
                        ios_share_content,
                        facebook,
                        instagram,
                        support_number,
                        support_email,
                    } = req.body;

                    // Create an AppSetting document
                    const appSetting = await AppSetting.create({
                        app_store_url,
                        play_store_url,
                        android_version,
                        ios_version,
                        android_share_content,
                        ios_share_content,
                        facebook,
                        instagram,
                        support_number,
                        support_email,
                    });

                    // Return the response
                    return _RS.apiNew(
                        res,
                        true,
                        "AppSetting added successfully",
                        { data: appSetting },
                        startTime
                    );
                } catch (error) {
                    console.error("Error:", error);
                    next(error);
                }
            }
        );

        this.router.put(
            "/:id",
            Authentication.admin,
            [
                body("app_store_url").optional().isString().withMessage("Valid app store URL must be provided"),
                body("play_store_url").optional().isString().withMessage("Valid play store URL must be provided"),
                body("android_version").optional().isString().withMessage("Valid Android version must be provided"),
                body("ios_version").optional().isString().withMessage("Valid Ios version must be provided"),
                body("android_share_content").optional().isString().withMessage("Valid android_share_content must be provided"),
                body("ios_share_content").optional().isString().withMessage("Valid ios_share_content must be provided"),
                body("facebook").optional().isString().withMessage("Valid facebook must be provided"),
                body("instagram").optional().isString().withMessage("Valid instagram must be provided"),
                body("country_code").optional().isString().withMessage("Valid country_code must be provided"),
                body("mobile_number").optional().isString().withMessage("Valid mobile_number must be provided"),
                body("email").optional().isString().withMessage("Valid email must be provided"),
            ],
            ValidateRequest,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();
                    const id = req.params.id


                    const {
                        app_store_url,
                        play_store_url,
                        android_version,
                        ios_version,
                        android_share_content,
                        ios_share_content,
                        facebook,
                        instagram,
                        mobile_number,
                        country_code,
                        email,
                    } = req.body;

                    const choice = await AppSetting.findOne({})

                    if (!choice) {
                        return _RS.apiNew(res, false, "App setting not found", {}, startTime);
                    }

                    choice.app_store_url = app_store_url ? app_store_url : choice.app_store_url
                    choice.play_store_url = play_store_url ? play_store_url : choice.play_store_url
                    choice.android_version = android_version ? android_version : choice.android_version
                    choice.ios_version = ios_version ? ios_version : choice.ios_version
                    choice.android_share_content = android_share_content ? android_share_content : choice.android_share_content
                    choice.ios_share_content = ios_share_content ? ios_share_content : choice.ios_share_content
                    choice.facebook = facebook ? facebook : choice.facebook
                    choice.instagram = instagram ? instagram : choice.instagram
                    choice.country_code = country_code ? country_code : choice.country_code
                    choice.mobile_number = mobile_number ? mobile_number : choice.mobile_number
                    choice.email = email ? email.toLowerCase() : choice.email

                    await choice.save()

                    return _RS.apiNew(res, true, "Settings updated successfully", { data: choice }, startTime);

                } catch (error) {
                    console.error("Error:", error);
                    next(error);
                }
            }
        );
    }

    public get() {
        this.router.get(
            "/",
            Authentication.admin,
            // Validation middleware for getting FoodChoices
            ValidateRequest,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    const foodChoices = await AppSetting.findOne({});

                    return _RS.apiNew(res, true, "Settings retrieved successfully", foodChoices, startTime);
                } catch (error) {
                    console.error("Error:", error);
                    next(error);
                }
            }
        );
    }
}

export default new AppSettingRouter().router;
