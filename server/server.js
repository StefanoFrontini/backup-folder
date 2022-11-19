import express from "express";
import api from "./routes/api.js";

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json());
app.use("/api", api);

// const copyFile = async (src, dest) => {
//   await fs.promises.copyFile(src, dest);
// };

// routes
app.get("/", (req, res) => {
  res.send("Backup server!");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
