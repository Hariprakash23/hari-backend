import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
const generateAccessAndRefreshTokens = async (userId)=>{

   
    try {
      // finding user
         const user = await User.findById(userId)
         // generting tokes , hume user model me ye methods define kiye hai
         const accessToken =  user.generateAccessToken()
         const refreshToken = user.generateRefreshToken()

         // user ka refresh token ki entry kari
         user.refreshToken = refreshToken
         // entry save bhi krenge
         
        await user.save({validateBeforeSave: false}) // validate before save isliye kr rhe ha taaki kuch required fields model me check na ho

         return {accessToken,refreshToken};
    } catch (error) {
      throw new ApiError(500,"Something went wrong while generating refresh and access tokens")
    }
}

const registerUser = asyncHandler(async (req,res)=>{

    // get user details from backend
    // validation i.e check if not empty field is provided
    // check if user already exist: we will be checking using email and username
    // check for images and avatar
    // upload them at cloudinary, avatar
    // create user object - create entry in DB
    // remove password and response token field from response 
    // return res


    // data req.body se ata ha jab form se beja ho data
    // validating the data
     const {fullname,username,email,password}=req.body

     if(
        [fullname,username,email,password].some((field)=> 
        field?.trim() ==="")
     ){
        
        throw new ApiError(400,"All fields are required")
     }
    
     //checking if user already exists
     // database import kr liya ha findone method se entry check krege
     // $or se hum multiple fields check kr sakte ha findone method me hi
     const existedUser = await User.findOne({
        $or:[{ username }, { email }]
     })

     // agr existedUser h to error thorw krenge
     if(existedUser) {
        throw new ApiError(409,"User already existed with username or email")
     }

     // req?.files humko multer se mila ha to handle files
     // niche wale command se file ka path mil jayega
     const avatarLocalPath = req.files?.avatar[0]?.path;

     // upar wali command local path k liye lekin traditional method se krenge + traditional method se ek bug bhi fix kiya gya ha
     // hum coverimage nhi bejenge to error aa rhi thi upar wale method 
     
   //   const coverImageLocalPath = req.files?.coverImage[0]?.path;
     // niche wale method se hum coverImage  nhi bejege to bhi error nhi ayyegi
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
      coverImageLocalPath = req.files.coverImage[0].path
   }
 
     // checking for avatar , hum coverimage pe nhi kr rhe qki converimage ko hum importance nhi de rhe ha
     if(!avatarLocalPath) {
        throw new ApiError(400,"Avatar File is Required")
     }

     // uploading avatar and coverimage on cloudinary
     const avatar = await uploadOnCloudinary(avatarLocalPath)
     const coverImage = await uploadOnCloudinary(coverImageLocalPath)


     
     // checkcing if avatar is really uploaded
     if(!avatar) {
        throw new ApiError(400,"Avatar is Required")
     }

     //creating the entry in Database
     const user = await User.create({
        fullname,
        // .url , url de dega avatar ki
        avatar: avatar.url,
        // because hum coverimage compulsary nhi kr rhe h to hum check kr rhe h ki coverimage ki URL he bhi ya nhi
        // agr nhi hu to empty kr denge
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
     })

    // chcecking ki user create hua bhi h ya nhi
    // jab bhi object create hota ha to mongodb ek _id asign kr deta hai
    // ab hum check krenge is id se ki user exist krta ha ya nhi
    //createdUser me reference le lenge agr mila ha to fir select function entries deselect kr deta ha i.e
    // is created user me password or refreshtoken hata denge
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500,"Something went wrong while registering")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfuly")
    )

})

const loginUser = asyncHandler(async (req,res)=>{
 // req body se data lena ha
 // user exist krta ha ya nhi chceck krna ha based on email/username
 //find user
 //password check
 // access token and refresh token generate krenge uesr validation hone k bad
 // send the tokens in form of cookies

 const {email,username,password} = req.body
 

   // email ya username koi ek chiz jaurri h login k liye
 if(!(email ||username)) {
   throw new ApiError(400,"username or email is required")
 } 
 
 // jo entry user ne ki hogi uske base pe hum apne database me user find kr rhe ha
 // $or ki help se find krenge username ya email se jo entry ayegi usko fir save bhi krelgen 
 const user = await User.findOne({
   $or: [{username},{email}]
 })
 if(!user) {
   throw new ApiError(404,"User doesn't exists");
 }


 // password check krnge, humne ek method define kiya ha user model me isPasswordCorrect jo ki pass validate krega using bcrypt
 // line no 70 pe define h usermodel me
 const isPasswordValid = user.isPasswordCorrect(password)
 if(!isPasswordValid) {
   throw new ApiError(401,"Invalid User Credentials")
 }
 // password sahi hone k bad access token or refresh token generate krege
 // why these tokens? -> A refresh token just helps you re-validate a user without them having to re-enter their 
 //login credentials multiple times..  (i.e session extending)
 // ye tokens kaafi bar banaye jate h to hum iska method hi bana dete hai(upar bana diya hai)

 const {accessToken,refreshToken} =  await generateAccessAndRefreshTokens(user._id)

 // user ki refresh token entry hone k bad ab hum updated user nikalege 
 
 const loggedInUser= await User.findById(user._id).select("-password -refreshToken");

 //  cookies bejne se pehle options define krne padte ha
 const options = {
   httpOnly:true, // by default cookies are editable at frontend bug when you do httponly:true it  can be modifiable by only server
   secure: true
 }

  // cookie parser(middleware) ki help se cookie pass krenge
 return res.status(200).
 cookie("accessToken",accessToken,options)
 .cookie("refreshToken",refreshToken,options)
 .json(
   new ApiResponse(
      200,
      {
         // upar cookies beje gye ha lekin alg se bhi send kr rhe h cookies qki agr user ko use krna ho tokens
         user: loggedInUser,accessToken,refreshToken
      },
      "User logged in successfully"
   )
 )
})

const logoutUser= asyncHandler(async (req,res)=>{
   // logout krenge lekin user kaha se leke au ? logout k time to hum email pass nhi maang sakte
   // hum apna ek middleware design krenge ( auth middleware)
   // ye verify krega ki user hai ya nhi loggedin

   // lgout krenge to refresh token removekrna padega , below cmd will do it
   
   await User.findByIdAndUpdate(
      req.user._id, // req.user me user humne enter kiya h through auth middleware
      {
         // $set se update kr denge
         $set: {
            refreshToken : undefined // refresh token ko empty kr diya
         }
      },
      {
         new: true
      }
      )

      // cookies clear krenge ab
      const options = {
         httpOnly:true, 
         secure: true
       }
       return res
       .status(200)
       .clearCookie("accessToken",options)
       .clearCookie("refreshToken",options)
       .json(
         new ApiResponse(200,{},"User logged out sucessfully")
       )
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
   //access token ko refresh krna ha, jab bhi kabhi user refresh karayega to use uska refresh token bejna padega
   // user freshtoken ko cookies k through bejega , cookies se beji h to hum usko req.cookie use krke access kr sakte h


   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken // ho sakta ha body se bhi bej de
   if(!incomingRefreshToken) {
      throw new ApiError(401,"Unauthorized Request")
   }

   // JWt k throught verify krege, user k pas jo token ha wo encoded hai mtlb form alg h lekin verification me humko original lagegi
   // to hum jwt k through usko decode kr rhe hai verify method se

   try {
      const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      )
      // token generate kiye the tab ek id bhi assign ki thi ( user modal line no 100) 
      // to hum is id k through user nikal sakte ha database me
       const user = await  User.findById(decodedToken?._id)
       if(!user) {
         throw new ApiError(401,"Invalid refresh token")
       }
       // matching the tokens
       if(incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401,"Refresh token is expired or used")
       }
   
       //match hogye to fir new token generate kr denge
       const options = {
         httpOnly: true,
         secure :true
       }
   
       const {accessToken, newRefreshToken } =await generateAccessAndRefreshTokens(user._id)
       return res
       .status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",newRefreshToken,options)
       .json(
         new ApiResponse(200,{accessToken,newRefreshToken},"Access token refreshed successfully")
       )
   } catch (error) {
      throw new ApiError(401,error?.message||"invalid refresh token")
   }
})
export {registerUser,loginUser,logoutUser,refreshAccessToken}