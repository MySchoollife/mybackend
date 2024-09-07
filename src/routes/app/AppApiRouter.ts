import { Router } from "express";
import ValidateRequest from "../../Middlewares/ValidateRequest";
import _RS from "../../helpers/ResponseHelper";
import Content from "../../models/Content"; 
import AppSetting from "../../models/AppSetting";
import Authentication from "../../Middlewares/Authnetication";

const professions = [
    { name: "Software Developer" },
    { name: "Registered Nurse" },
    { name: "Accountant" },
    { name: "Teacher" },
    { name: "Electrician" },
    { name: "Graphic Designer" },
    { name: "Marketing Manager" },
    { name: "Doctor" },
    { name: "Sales Representative" },
    { name: "Human Resources Specialist" }
  ]

class AppApiRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.get();
    }

    public get() {
        this.router.get(
            "/terms-and-conditions",
           // Authentication.user,
            [
               // query('delivery_type').optional().notEmpty().isIn(['Delivery', 'Pickup']).withMessage('Valid delivery_type must be provided'),
            ],
            ValidateRequest,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    const data = await Content.find({ slug :'terms-and-conditions' })
                   
                    return _RS.apiNew(res, true, "Terms & Conditions retrieved successfully", {
                        data
                    }, startTime);

                } catch (error) {
                    console.error("Error:", error);
                    next(error);
                }
            }
        ); 

        this.router.get(
            "/terms-and-conditions-driver",
           // Authentication.user,
            [
               // query('delivery_type').optional().notEmpty().isIn(['Delivery', 'Pickup']).withMessage('Valid delivery_type must be provided'),
            ],
            ValidateRequest,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    const data = await Content.find({ slug :'driver-agreement' })
                   
                    return _RS.apiNew(res, true, "Terms & Conditions retrieved successfully", {
                        data
                    }, startTime);

                } catch (error) {
                    console.error("Error:", error);
                    next(error);
                }
            }
        );
         
        this.router.get(
            "/terms-and-conditions-restaurant",
           // Authentication.user,
            [
               // query('delivery_type').optional().notEmpty().isIn(['Delivery', 'Pickup']).withMessage('Valid delivery_type must be provided'),
            ],
            ValidateRequest,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    const data = await Content.find({ slug :'restaurant-agreement' })
                   
                    return _RS.apiNew(res, true, "Terms & Conditions retrieved successfully", {
                        data
                    }, startTime);

                } catch (error) {
                    console.error("Error:", error);
                    next(error);
                }
            }
        );

        this.router.get(
            "/privacy-policy",
           // Authentication.user,
            [
               // query('delivery_type').optional().notEmpty().isIn(['Delivery', 'Pickup']).withMessage('Valid delivery_type must be provided'),
            ],
            ValidateRequest,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    const data = await Content.find({ slug :'privacy-policy' })
                   
                    return _RS.apiNew(res, true, "Privacy Policy retrieved successfully", {
                        data
                    }, startTime);

                } catch (error) {
                    console.error("Error:", error);
                    next(error);
                }
            }
        ); 
        this.router.get(
            "/profession",
           // Authentication.user,
            [
               // query('delivery_type').optional().notEmpty().isIn(['Delivery', 'Pickup']).withMessage('Valid delivery_type must be provided'),
            ],
            ValidateRequest,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    const data = professions
                   
                    return _RS.apiNew(res, true, "Profession retrieved successfully", {
                        data
                    }, startTime);

                } catch (error) {
                    console.error("Error:", error);
                    next(error);
                }
            }
        ); 

        this.router.get(
            "/settings",
             Authentication.user,
            [
               // query('delivery_type').optional().notEmpty().isIn(['Delivery', 'Pickup']).withMessage('Valid delivery_type must be provided'),
            ],
            ValidateRequest,
            async (req, res, next) => {
                try {
                    const startTime = new Date().getTime();

                    const data = await AppSetting.findOne({})
                   
                    return _RS.apiNew(res, true, "Profession retrieved successfully", {
                        data
                    }, startTime);

                } catch (error) {
                    console.error("Error:", error);
                    next(error);
                }
            }
        );
    }
}

export default new AppApiRouter().router;
