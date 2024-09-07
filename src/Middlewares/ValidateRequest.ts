
import { validationResult } from 'express-validator';

const ValidateRequest = async (req, res, next) => {
    try {
        const result = validationResult(req);
        if (result.isEmpty()) {
            return next()
        }

        const errors =  result.array().map((item:any)=>({
            message:item.msg,
            field:item.param
        }))
        
        // res.send({ errors: errors }); 
        return res.status(400).json({ errors: errors });

    } catch (err) {
        return next(err);
    }
}

export default ValidateRequest
