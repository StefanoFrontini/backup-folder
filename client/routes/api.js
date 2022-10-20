import express from "express";

import { getFile, postResult } from "../controllers/api.js";

const router = express.Router();

router.get("/", getFile);
router.post("/", postResult);

// router.route("/").get(getFile).post(postResult);

export default router;
