import User from "../models/userModel.js";

export const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token to DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false }); // ← skip validation on save

  return { accessToken, refreshToken };
};
