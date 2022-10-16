import fs from "fs";
import path from "path";
import net from "node:net";

const myDataDir = "sender";
const myBackupDir = "receiver";

const PORT = 8000;
const HOST = "0.0.0.0";

const options = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
};
const formatDate = (date) => {
  return new Intl.DateTimeFormat("it-IT", options).format(new Date(date));
};
// atime - time of last access
// mtime - time of last modification
// ctime - time of last status change

const getMyData = async (dir) => {
  try {
    const files = await fs.promises.readdir(dir);
    return files.map((file) => {
      return {
        name: file,
        // atime: new Date(fs.statSync(`${dir}/${file}`).atime),
        mtime: new Date(fs.statSync(`${dir}/${file}`).mtime),
        // ctime: fs.statSync(`${dir}/${file}`).ctime,
        size: fs.statSync(`${dir}/${file}`).size,
      };
    });
  } catch (error) {
    console.error(error);
  }
};

// const printResult = async () => {
//   console.log(await getFiles(myDir));
// };

// printResult();
// const printHashTable = async () => {
//   let hash = {};
//   const arr = await getMyData(myData);
//   for (let element of arr) {
//     hash[element.name] = {
//       atime: element.atime,
//       mtime: element.mtime,
//       ctime: element.ctime,
//     };
//   }
//   console.log(hash);
// };

// printHashTable();

const copyFile = async (src, dest) => {
  await fs.promises.copyFile(src, dest);
};
const deleteFile = async (dir, file) => {
  await fs.promises.unlink(path.join(dir, file));
};
const sendFile = (dir, file) => {
  const server = net
    .createServer((socket) => {
      socket.pipe(process.stdout);
      socket.write(file);
      const fileStream = fs.createReadStream(path.join(dir, file));
      fileStream.on("readable", function () {
        let data;
        while ((data = this.read())) {
          socket.write(data);
        }
      });
      fileStream.on("end", function () {
        socket.end();
      });
      socket.on("end", () => {
        server.close(() => console.log("\nTransfer is done!"));
      });
    })
    .on("error", (error) => {
      if (e.code === "EADDRINUSE") {
        console.log("Address in use, retrying...");
        setTimeout(() => {
          server.close();
          server.listen(PORT, HOST);
        }, 1000);
      }
      console.error(error);
      server.close(() => console.log("Server closed"));
      throw error;
    });

  server.listen(PORT, HOST, () => {
    console.log("Sending file: ", file);
  });
  // server.listen(() => {
  //   console.log("Opened server on: ", server.address());
  //   console.log("Sending file: ", file);
  // });
};

// const backupMyDataOld = async () => {
//   const dati = await getMyData(myDataDir);
//   const backup = await getMyData(myBackupDir);
//   console.log("myData: ", dati);
//   console.log("myBackup:", backup);

//   for (let i = 0; i < dati.length; i++) {
//     label: {
//       for (let j = 0; j < backup.length; j++) {
//         console.log(dati[i].name, backup[j].name);

//         if (
//           dati[i].name === backup[j].name &&
//           dati[i].mtime > backup[j].mtime
//         ) {
//           try {
//             copyFile(
//               `./${myDataDir}/${dati[i].name}`,
//               `./${myBackupDir}/${dati[i].name}`
//             );
//             console.log(
//               `Copia del nuovo file più aggiornato: ${dati[i].name} - ${dati[i].mtime} - backup: ${backup[j].mtime}`
//             );
//           } catch (error) {
//             console.error(error);
//           }
//           break label;
//         }
//         if (
//           dati[i].name === backup[j].name &&
//           dati[i].mtime <= backup[j].mtime
//         ) {
//           console.log(
//             `Nessun backup: il file ${dati[i].name} non è stato aggiornato`
//           );

//           break label;
//         }
//       }

//       copyFile(
//         `./${myDataDir}/${dati[i].name}`,
//         `./${myBackupDir}/${dati[i].name}`
//       );
//       console.log(`Backup del nuovo file: ${dati[i].name}`);
//     }
//   }
// };

const backupDati = async () => {
  const backupArray = await getMyData(myBackupDir);
  let backupHashTable = {};
  for (let el of backupArray) {
    backupHashTable[el.name] = {
      name: el.name,
      mtime: el.mtime,
      size: el.size,
    };
  }
  const filesToDelete = { ...backupHashTable };
  const dati = await getMyData(myDataDir);
  for (let el of dati) {
    if (el.name in backupHashTable) {
      delete filesToDelete[el.name];
    }
    if (
      el.name in backupHashTable &&
      new Date(el.mtime) > new Date(backupHashTable[el.name].mtime)
    ) {
      try {
        // copyFile(`./${myDataDir}/${el.name}`, `./${myBackupDir}/${el.name}`);
        sendFile(myDataDir, el.name);
        console.log(
          `Backup del nuovo file più aggiornato: ${el.name} - ${
            el.mtime
          } - backup: ${backupHashTable[el.name].mtime}`
        );
      } catch (error) {
        console.error(error);
      }
    }
    if (!(el.name in backupHashTable)) {
      // copyFile(`./${myDataDir}/${el.name}`, `./${myBackupDir}/${el.name}`);
      try {
        sendFile(myDataDir, el.name);
        console.log(`Backup del nuovo file: ${el.name}`);
      } catch (error) {
        console.error(error);
      }
    }
  }
  const keysToDelete = Object.keys(filesToDelete);
  console.log("keys to delete:", keysToDelete);
  if (keysToDelete.length > 0) {
    for (let el of keysToDelete) {
      deleteFile(myBackupDir, el);
      console.log("Elimina file:", el);
    }
  }
};

backupDati();
