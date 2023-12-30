import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

// middleware inject kiya ha humne registerUser se pehle for images handling
// 2 files hum le rhe ha
router.route("/register").post(
    upload.fields([
    { 
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount: 1
    }
    ])
    ,registerUser)

    router.route("/login").post(loginUser)
    // secured routes
    // verifyJWT from auth middleware  inject ho jayega fir logoutUser hoga
    router.route("/logout").post( verifyJWT ,logoutUser)

export default router