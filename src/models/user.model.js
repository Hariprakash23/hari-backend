import mongoose  from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";


const userSchema= new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        // index rakhne se searching ability optimized ho jati h as com to normal searching
        index: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String, //clourdinary URL use krege
        required: true,
    },
    coverImage:{
        type: String // cloudinary URL
    },
    watchHistory:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }],
    password: {
        type: String,
        required: [true,"Password is required"]
    },
    refreshToken :{
        type:String,
        
    }

},{timestamps:true})


// pre hook use kr rhe h, save krne se pehle ye execute hoga
userSchema.pre("save", async function(next) {
    
    // agr password me change ha to encryption lagayenge warna nhi
    // isModified inbuilt function ha batata ha ki change h ya nhi jo ki ek string field leta hai
    if(this.isModified("password")) {
        // encryption password using bcrypt library, 10 is the numbmer of rounds used in algorith it can be other number too
        this.password = bcrypt.hash(this.password,10)
        //kaam hone k bad next midddleware call krdo
        next()
    }
    
    //agr pass modify nhi kia ha user ne to 
    next(   )

})

// ab hum is schema me ek method/property add krege jo ki check krega ki pass correct h ya wrong

userSchema.methods.isPasswordCorrect = async function(password) {
    // bcrypt can validate it
    //password jo ki user ne beja ha
    // this.password wo h jo already saved h database me
     return await bcrypt.compare(password,this.password)
}

// creating a custom method to generate tokens
userSchema.methods.generateAccessToken = function(){
    // jwt sign method used to generate token

    return jwt.sign({
        // ye payload data hai
        // _id humne leli this.id se 
        // ese hi email leli this.email as so on
        _id : this.id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }

    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
    
        _id : this.id,
    },
    process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }

    )
}

export const User = mongoose.model("User",userSchema)