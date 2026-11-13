import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_SECRET_TOKEN);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }

    throw new ApiError(401, "Invalid access token");
  }

  const user = await User.findById(decodedToken?.user_Id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(401, "Invalid access token");
  }

  if (!user.isActive) {
    throw new ApiError(403, "User is inactive, please contact admin");
  }

  req.user = user;
  next();
})

