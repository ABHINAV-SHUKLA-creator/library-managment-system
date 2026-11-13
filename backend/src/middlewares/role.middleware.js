import {ApiError} from "../utils/ApiError.js";

export const verifyRole = (...roles) => {
    return (req,res,next) => {
        if(!req.user){
            throw new ApiError(401, 'unorized request, user not found');
        }

        if(!roles.includes(req.user.role)){
            throw new ApiError(403, 'access denied, not permitted');
        }
        next();
    }
}
