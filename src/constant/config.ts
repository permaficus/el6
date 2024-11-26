import dotenv from "dotenv";
dotenv.config().parsed;

export const TARGET_URL = process.env.TARGET_URL;
export const API_KEY = process.env.API_KEY;
export const API_SECRET = process.env.API_SECRET;