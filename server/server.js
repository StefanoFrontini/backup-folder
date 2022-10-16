import { unlink, readdir } from "fs/promises";
import path from "path";
import express from "express";
import axios from "axios";

import { statSync, createWriteStream } from "fs";

// import * as stream from "stream";
// import { promisify } from "util";

// const finished = promisify(stream.finished);

const app = express();
const PORT = 3000;

const client_url = "http://localhost:5000/api/query";

const backupDir = "backup";

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

// const copyFile = async (src, dest) => {
//   await fs.promises.copyFile(src, dest);
// };
const deleteFile = async (dir, file) => {
  try {
    await unlink(path.join(dir, file));
    console.log(`File deleted! - ${file}`);
    return file;
  } catch (error) {
    console.error(error);
  }
};

const downloadFile = async (file) => {
  try {
    const { data } = await axios({
      url: client_url,
      method: "GET",
      responseType: "stream",
      params: { filePath: file },
    });
    const writer = createWriteStream(path.join(backupDir, file));
    data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log(`File received and saved! - ${file}`);
        resolve(file);
      });

      writer.on("error", () => {
        console.log(`Something went wrong - File not saved! - ${file}`);
        reject("Rejected!");
      });
    });
  } catch (error) {
    console.log(error.response.data);
  }
};
// routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.post("/", async (req, res) => {
  let { data } = req.body;
  if (!data) {
    return res
      .status(400)
      .json({ success: false, msg: "Non è stato inviato alcun dato" });
  }
  data = data.filter((el) => el.name !== ".DS_Store");
  const filesToChange = {
    filesToUpdate: [],
    filesToDelete: [],
  };
  let backupArray = await getBackup(backupDir);
  backupArray = backupArray.filter((el) => el.name !== ".DS_Store");

  const backup = {};
  for (let el of backupArray) {
    backup[el.name] = {
      name: el.name,
      mtime: el.mtime,
    };
  }

  const filesToDelete = { ...backup };
  for (let el of data) {
    if (el.name in backup) {
      delete filesToDelete[el.name];
    }
    if (
      el.name in backup &&
      el.name &&
      new Date(el.mtime) > new Date(backup[el.name].mtime)
    ) {
      filesToChange.filesToUpdate.push(el.name);
      console.log(
        `Trovato nuovo file più aggiornato: ${el.name} - ${
          el.mtime
        } - backup: ${backup[el.name].mtime}`
      );
    }
    if (!(el.name in backup) && el.name) {
      filesToChange.filesToUpdate.push(el.name);
      console.log(`Trovato nuovo file: ${el.name}`);
    }
  }
  const keysToDelete = Object.keys(filesToDelete);
  if (keysToDelete.length > 0) {
    for (let el of keysToDelete) {
      filesToChange.filesToDelete.push(el);
      // deleteFile(myBackupDir, el);
    }
  }
  const downloadFilePromises = () =>
    filesToChange.filesToUpdate.map((el) => downloadFile(el));

  const deleteFilePromises = () =>
    filesToChange.filesToDelete.map((el) => deleteFile(backupDir, el));

  console.log("Files to change: ", filesToChange);

  const success = await Promise.all([
    ...downloadFilePromises(),
    ...deleteFilePromises(),
  ]);
  console.log("Backup completed!", success);
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
