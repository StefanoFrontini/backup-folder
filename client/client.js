import { readdir, writeFile, readFile } from "fs/promises";
import { statSync } from "fs";
import axios from "axios";

import path from "path";

const dataDir = "dataToBackup";

const server_url = "http://localhost:3000";

const PORT = 5000;

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

const sendListOfFilesToUpdate = async () => {
  // const filesToSend = {
  //   filesToUpdate: [],
  //   filesToDelete: [],
  // };
  // const backup = await getBackup();
  // const filesToDelete = { ...backup };
  const dataToBackup = await getDataToBackup(dataDir);
  console.log(dataToBackup);
  for (let el of dataToBackup) {
    if (el.name in backup) {
      delete filesToDelete[el.name];
    }
    if (
      el.name in backup &&
      new Date(el.mtime) > new Date(backup[el.name].mtime)
    ) {
      filesToSend.filesToUpdate.push(el.name);
      console.log(
        `Trovato nuovo file più aggiornato: ${el.name} - ${
          el.mtime
        } - backup: ${backup[el.name].mtime}`
      );
    }
    if (!(el.name in backup)) {
      filesToSend.filesToUpdate.push(el.name);
      console.log(`Trovato nuovo file: ${el.name}`);
    }
  }
  const keysToDelete = Object.keys(filesToDelete);
  if (keysToDelete.length > 0) {
    for (let el of keysToDelete) {
      filesToSend.filesToDelete.push(el);
      // deleteFile(myBackupDir, el);
      console.log("File da eliminare: ", el);
    }
  }
  const { data } = await axios.post(server_url, { data: dataToBackup });
  console.log("Server message: ", data);
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