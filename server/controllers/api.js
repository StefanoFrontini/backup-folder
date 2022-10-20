import { createWriteStream } from "node:fs";
import path from "path";
import { unlink, readdir } from "node:fs/promises";
import { statSync } from "node:fs";
import axios from "axios";

const backupDir = "backup";

const postData = async (req, res) => {
  let { data } = req.body;
  if (!data) {
    return res
      .status(400)
      .json({ success: false, msg: "Non è stato inviato alcun dato!" });
  }
  res.status(201).json({
    success: true,
    msg: `Dati inviati al server correttamente!`,
  });
  console.log("Dati ricevuti correttamente dal client!");
  let { dataToBackup, tunnel_url, date } = data;
  const download_url = `${tunnel_url}/api`;

  console.log({ tunnel_url });
  dataToBackup = dataToBackup.filter((el) => el.name !== ".DS_Store");
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
  for (let el of dataToBackup) {
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
    filesToChange.filesToUpdate.map((el) => downloadFile(el, download_url));

  const deleteFilePromises = () =>
    filesToChange.filesToDelete.map((el) => deleteFile(backupDir, el));

  console.log("Files to change: ", filesToChange);

  try {
    const result = await Promise.all([
      ...downloadFilePromises(),
      ...deleteFilePromises(),
    ]);
    // const result_url = `${tunnel_url}/api`;
    // console.log(result_url);
    await axios.post(download_url, {
      success: true,
      msg: `Backup di ${result.length} ${
        result.length < 2 ? "file" : "files"
      } completato!`,
      date,
    });
    console.log(
      `Backup di ${result.length} ${
        result.length < 2 ? "file" : "files"
      } completato!`
    );
  } catch (error) {
    console.error(`Backup non riuscito! - ${error}`);
    await axios.post(download_url, {
      success: false,
      msg: `Backup non riuscito! - ${error}`,
    });
  }
};

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

const deleteFile = async (dir, file, res) => {
  try {
    await unlink(path.join(dir, file));
    console.log(`File deleted! - ${file}`);
    return file;
  } catch (error) {
    res
      .sendStatus(400)
      .json({ success: false, msg: `Cancellazione del ${file} non riuscita!` });
    throw new Error(`Cancellazione del file non riuscita! - ${file}`);
  }
};

const downloadFile = async (file, url) => {
  try {
    const { data } = await axios({
      url,
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
        reject(`Something went wrong - File not saved! - ${file}`);
      });
    });
  } catch (error) {
    throw new Error(`Download del file: ${file} non riuscito!`);
  }
};

export { postData };
