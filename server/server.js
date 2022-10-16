// import fs from "fs";
// import path from "path";
import express from "express";

const app = express();
const PORT = 3000;

// const backupDir = "backup";

// Middlewares
app.use(express.json());

const getBackup = async (dir) => {
  try {
    const files = await readdir(dir);
    return files.map((file) => {
      return {
        name: file,
        mtime: new Date(statSync(path.join(dir, file)).mtime),
        //size: statSync(`${dir}/${file}`).size,
      };
    });
  } catch (error) {
    console.error(error);
  }
};

// routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.post("/", async (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res
      .status(400)
      .json({ success: false, msg: "Non è stato inviato alcun dato" });
  }
  const filesToChange = {
    filesToUpdate: [],
    filesToDelete: [],
  };
  const backup = await getBackup();
  const filesToDelete = { ...backup };
  for (let el of data) {
    if (el.name in backup) {
      delete filesToDelete[el.name];
    }
    if (
      el.name in backup &&
      new Date(el.mtime) > new Date(backup[el.name].mtime)
    ) {
      filesToChange.filesToUpdate.push(el.name);
      console.log(
        `Trovato nuovo file più aggiornato: ${el.name} - ${
          el.mtime
        } - backup: ${backup[el.name].mtime}`
      );
    }
    if (!(el.name in backup)) {
      filesToChange.filesToUpdate.push(el.name);
      console.log(`Trovato nuovo file: ${el.name}`);
    }
  }
  const keysToDelete = Object.keys(filesToDelete);
  if (keysToDelete.length > 0) {
    for (let el of keysToDelete) {
      filesToChange.filesToDelete.push(el);
      // deleteFile(myBackupDir, el);
      console.log("File da eliminare: ", el);
    }
  }
  res.status(201).json({ success: true, msg: "Data received!" });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

// const socket = net.connect(8000);

// let fileStream = fs.createWriteStream(
//   "./receiver/CREDITO IMPOSTA 2022 - SIOLI SERRAMENTI.xlsx"
// );
// let date = new Date(),
//   size = 0,
//   elapsed;

// socket.on("data", (chunk) => {
//   size += chunk.length;
//   elapsed = new Date() - date;
//   socket.write(
//     `\r${(size / (1024 * 1024)).toFixed(
//       2
//     )} MB of data was sent. Total elapsed time is ${elapsed / 1000} s`
//   );
//   process.stdout.write(
//     `\r${(size / (1024 * 1024)).toFixed(
//       2
//     )} MB of data was sent. Total elapsed time is ${elapsed / 1000} s`
//   );
//   fileStream.write(chunk);
// });
// socket.on("end", () => {
//   console.log(
//     `\nFinished getting file. Speed was: ${(
//       size /
//       (1024 * 1024) /
//       (elapsed / 1000)
//     ).toFixed(2)} MB/s`
//   );
//   process.exit();
// });
