class ApiError extends Error {
    // constructor
    constructor(
        statusCode,
        message= "Something went wrong",
        error = [],
        statck = ""
    )
    {
        super(message)
        this.statusCode = statusCode,
        this.data= null,
        this.message= message,
        this.success = false,
        this.errors = errors   
        if(statck) {
            this.stack = statck 
        } else {
            error.captureStackTrace (this,this.constructor)
        }
    }
}