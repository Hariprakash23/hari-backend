import {v2 as cloudinary} from 'cloudinary';
import { response } from 'express';
import fs from "fs"
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary =async  (localFilePath)=>{
try {
  if(!localFilePath) return null
  const response = await cloudinary.uploader.upload(localFilePath,{
    resource_type: "auto"
  })
  // file uploaded successfully
  // console.log("File Uploaded Successfull",response.url)

  fs.unlinkSync(localFilePath)
  return response;


} catch (error) {
    fs.unlinkSync(localFilePath) // remove the locally saved temp file as the upload operation is failed
    return null;
}
}

export {uploadOnCloudinary}