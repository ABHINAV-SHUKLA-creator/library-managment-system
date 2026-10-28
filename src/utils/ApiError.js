class ApiError extends Error {
  constructor(statusCode, message="Something went wrong",errors=[],stack="") {
    super(message)
    this.statusCode = statusCode
    this.data=null 
    this.message = message
    this.sucess = false
    this.errors = errors

    //stack → where in the code the error happened (for developers debugging).
    // If a stack trace is provided, use it. Otherwise, capture the stack trace. 
    if(stack) {
      this.stack = stack
    }else{
      Error.captureStackTrace(this, this.constructor)
    }

  }
}  

export {ApiError}
