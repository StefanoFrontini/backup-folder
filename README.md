# Backup folder

The app allows you to backup all the files in a folder from a host connected to internet (client) to another (server)

Client and server are two node js web servers and files transfer is based on http protocol.

The app uses the createWriteStream and createReadStream Nodejs API.

## Installation

- copy the server folder on a web host and create a subfolder called: backup
- cd into /server and run: node server.js
- copy the client folder to a web host and create a subfolder called: dataToBackup and put some files in it
- edit the /client/client.js and change the server_url variable
- cd into /client and run: node client.js
- you should see the new files on server/backup folder
