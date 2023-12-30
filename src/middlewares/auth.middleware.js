import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt  from "jsonwebtoken";
// next lagana padega
export const verifyJWT = asyncHandler(async (req,res,next)=>{
        try {
            // cookies ko hum req,res se access kr sakte ha
            // ? mtlb optional 
            // ho skata ha cookies req se nhi aa rhi ho agr wo mobile me ho to wo custom header bej rha ho
            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") // agr header se aya hoga to "Bearer " k bad token hoga lekin humko bearer wagera nhi chaiye to usko replace kr denge empty stringse
            if(!token) {
                throw new ApiError(401,"Unauthorized Request")
            }
            //  token agr hua to humko JWT ki help se validate krna padega
            // verify krne k liye 2 value pass krenge token or secret key jo ki env me humne likh rakhi h 
            const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
            // user get krenge. agr decodedToken hoga to humko _id mil jayega (user model me line number 69)
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
            if(!user) {
                throw new ApiError(401,"Invalid access token")
            }
            // user he to ab hum req me new object add krdenge
            // req.user me humne user ka access de diya ha
            req.user = user; // isko hum usercontroller line no 197 me use kr krege
            next()
        } catch (error) {
            throw new ApiError(401,error?.message|| "invalid access token")
        }
})