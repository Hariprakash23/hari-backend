// promise based utility for database connection
const asyncHandler = (requestHandler)=>{
    (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}


export {asyncHandler}
//  below is higher order function - A higher order function is a function that takes one or more functions as arguments, 
// or returns a function as its result.


// const asyncHandler = () => {}
// const asyncHandler= (func) => ()=> {}
// const asyncHandler = (func) => async ()=>{}

//************ */ 2nd way to do it,  upar wala samjhne k liye ha

// const asyncHandler = (fn) => async (req,res,next) => {
//     try {
        
//     } catch (error) {

//         res.send(err.code || 1000).json( {
//             success: false,
//             message: err.message
//         })
//     }
// }