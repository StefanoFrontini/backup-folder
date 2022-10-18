import { readdir } from "fs/promises";
import { statSync, createReadStream } from "fs";
import axios from "axios";

import path from "path";
import express from "express";
import localtunnel from "localtunnel";

const app = express();
const PORT = 5000;

const tunnel = async () => {
  const tunnel = await localtunnel({ port: PORT });

  tunnel.on("close", () => {
    console.log("tunnel closed");
  });
  return tunnel.url;
};

// Middlewares
app.use(express.json());

const dataDir = "dataToBackup";

const server_url = "http://localhost:3000/";

const getDataToBackup = async (dir) => {
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
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

const sendListOfFilesToUpdate = async () => {
  let now = new Date();
  try {
    const result = await Promise.all([tunnel(), getDataToBackup(dataDir)]);
    console.log("tunnel_url:", result[0].toString());
    try {
      const { data } = await axios.post(server_url, {
        data: {
          tunnel_url: result[0].toString(),
          dataToBackup: result[1],
        },
      });
      const backupTime = new Date() - now;
      console.log({
        ...data,
        msg:
          data.msg + " - Backup eseguito in: " + backupTime / 1000 + " secondi",
      });
      // console.log(`Backup completato``)
    } catch (error) {
      if (error.code === "ECONNREFUSED") {
        console.log("Connessione al server non riuscita!");
      } else if (error.response.data) {
        console.log(error.response.data);
      } else {
        console.log("Error:", error);
      }
    }
  } catch (error) {
    console.error(error);
  }
};

sendListOfFilesToUpdate();

// const options = {
//   year: "numeric",
//   month: "numeric",
//   day: "numeric",
//   hour: "numeric",
//   minute: "numeric",
//   second: "numeric",
// };
// const formatDate = (date) => {
//   return new Intl.DateTimeFormat("it-IT", options).format(new Date(date));
// };
// atime - time of last access
// mtime - time of last modification
// ctime - time of last status change
// const writeJson = async (dir, data) => {
//   try {
//     await writeFile(path.join(dir, "backup.json"), JSON.stringify(data));
//   } catch (error) {
//     console.error(error);
//   }
// };
// const getDataWriteJson = async () => {
//   const data = await getMyData(dataDir);
//   const map = {};
//   for (let el of data) {
//     map[el.name] = {
//       name: el.name,
//       mtime: el.mtime,
//       size: el.size,
//     };
//   }

//   await writeJson(dataDirJson, map);
// };

// const getBackup = async () => {
//   try {
//     const data = await readFile(path.join(dataDirJson, "backup.json"), "utf8");
//     return JSON.parse(data);
//   } catch (error) {
//     console.error(error);
//   }
// };
