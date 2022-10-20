import { createReadStream } from "node:fs";
import path from "path";
const dataDir = "dataToBackup";

const getFile = (req, res) => {
  const { filePath } = req.query;
  if (!filePath) {
    return res
      .status(404)
      .json({ success: false, msg: "Please provide a filepath" });
  }
  const fileStream = createReadStream(path.join(dataDir, filePath));
  fileStream.on("open", () => {
    fileStream.pipe(res);
  });
  fileStream.on("error", () => {
    res.end("error");
  });
  // fileStream.on("close", () => {
  //   res.json({ success: true, msg: `File sent! ${filePath}` });
  // });
};

const postResult = (req, res) => {
  const data = req.body;

  if (!data) {
    return res
      .status(400)
      .json({ success: false, msg: "Non è stato inviato alcun dato!" });
  }
  const { success, msg, date } = data;

  const backupTime = new Date() - new Date(date);
  console.log({
    success,
    msg: msg + " - Backup eseguito in " + backupTime / 1000 + " secondi",
  });

  return res.status(201).json({
    success: true,
    msg: `Dati ricevuti correttamente!`,
  });
};

export { getFile, postResult };
