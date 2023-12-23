import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"
const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true,limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


// routes import
import userRouter  from "./routes/user.routes.js"


// routes declaration
// app.get krte the hum qki hum pehle yahi routes decleare krte the lekin ab humne seperate routes rakhe h to
// app.use method use krege
app.get("/",(req,res) =>{
    res.status(200).json({
        message:"HEy"
    })
})
app.use("/users",userRouter)

export {app}