import fs from "fs";
import path from "path";
import net from "node:net";

const myBackupDir = "receiver";

const socket = net.connect(8000);

let fileStream = fs.createWriteStream(
  "./receiver/CREDITO IMPOSTA 2022 - SIOLI SERRAMENTI.xlsx"
);
let date = new Date(),
  size = 0,
  elapsed;

socket.on("data", (chunk) => {
  size += chunk.length;
  elapsed = new Date() - date;
  socket.write(
    `\r${(size / (1024 * 1024)).toFixed(
      2
    )} MB of data was sent. Total elapsed time is ${elapsed / 1000} s`
  );
  process.stdout.write(
    `\r${(size / (1024 * 1024)).toFixed(
      2
    )} MB of data was sent. Total elapsed time is ${elapsed / 1000} s`
  );
  fileStream.write(chunk);
});
socket.on("end", () => {
  console.log(
    `\nFinished getting file. Speed was: ${(
      size /
      (1024 * 1024) /
      (elapsed / 1000)
    ).toFixed(2)} MB/s`
  );
  process.exit();
});
