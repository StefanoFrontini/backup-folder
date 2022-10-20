import express from "express";
import { postData } from "../controllers/api.js";

const router = express.Router();

router.post("/", postData);

export default router;
