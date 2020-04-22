const fs = require('fs');
const https = require('https');
const websocket = require("ws");
const Client = require("./client");
const Room = require("./room");
const settings = require("./settings");

const credentials = { key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem') };

var httpsServer = https.createServer(credentials);
httpsServer.listen(settings.port);

var wss = new websocket.Server({
    server: httpsServer
});

const actions = {
    "join": (client, request) => {
        if (request["roomID"]) {
            if (rooms[request["roomID"]]) {
                if (client.room == request["roomID"]) {
                    client.warning("You are already in this room");
                } else if (!client.room) {
                    client.room = request["roomID"];
                    client.ok("Entered room " + client.room);
                    rooms[client.room].addMember(client);
                    rooms[client.room].sendUpdateTo(client);
                } else {
                    client.ok("Changed from room " + client.room + " to room " + request["roomID"]);
                    rooms[client.room].removeMember(client);
                    client.room = request["roomID"];
                    rooms[client.room].addMember(client);
                    rooms[request["roomID"]].sendUpdateTo(client);
                }
            } else {
                client.error("The specified room is unknown");
            }
            if (request["name"]) {
                client.name = request["name"];
                client.ok("Hello " + client.name);
            }
        } else {
            client.error("No room specified");
        }
    },
    "leave": (client, request) => {
        if (client.room) {
            if (rooms[client.room]) {
                rooms[client.room].removeMember(client);
                client.ok("You left the room " + client.room);
                client.room = null;
            } else {
                client.warning("The room you were in (" + client.room + ") doesn't exist. You left it anyways.");
                client.room = null;
            }
        } else {
            client.error("You are in no room");
        }
    },
    "createRoom": (client, request) => {
        if (request["roomID"]) {
            if (!rooms[request["roomID"]]) {
                rooms[request["roomID"]] = new Room(request["roomID"]);
                client.ok("Room " + request["roomID"] + " was created");
            } else {
                client.error("The specified room id already exists");
            }
        } else {
            client.waring("No room id specified. Creating random...");
        }
    },
    "listRooms": (client, request) => {

    },
    "removeRoom": (client, request) => {

    },
    "change": (client, request) => {

    },
    "getUpdate": (client, request) => {

    },
};

var clients = [];
var rooms = {};

wss.on('connection', function connection(ws) {
    var client = new Client(ws);
    clients.push(client);
    console.log(ws.url + " connected");
    ws.on('message', function incoming(message) {
        console.log("received: %s from %s", message, client.name);
        try {
            const request = JSON.parse(message, (key, value) => {
                if (typeof value != "string" && typeof value != "number" && typeof value != "boolean") {

                }
                console.log(typeof value);
                return value;
            });
            if (request["action"]) {
                if (actions[request["action"]]) {
                    actions[request["action"]](client, request);
                } else {
                    client.error("Unknown action " + request["action"]);
                }
            } else {
                client.error("You have to specify the action you want to do");
            }
        } catch (e) {
            console.error("Client %s is not able to send properly formatted JSON!", client.name);
            console.log(e);
            client.error("Error: " + e.message);
        }
    });
});