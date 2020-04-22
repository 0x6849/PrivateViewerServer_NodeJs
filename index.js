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
            const roomId = request["roomID"].toString();
            if (rooms[roomId]) {
                client.joinRoom(rooms[roomId]);
            } else {
                client.error("The specified room is unknown");
            }
        } else {
            client.error("No room specified");
        }
    },
    "leave": (client, request) => {
        if (client.room) {
            client.leaveRoom();
        } else {
            client.error("You are in no room");
        }
    },
    "createRoom": (client, request) => {
        if (request["roomID"]) {
            const roomId = request["roomID"].toString();
            if (!rooms[roomId]) {
                rooms[roomId] = new Room(roomId);
                client.ok("Room " + roomId + " was created");
            } else {
                client.error("The specified room id already exists");
            }
        } else {
            client.waring("No room id specified. Creating random...");
        }
    },
    "listRooms": (client, request) => {
        client.send({
            "result": "ok",
            "rooms": Object.keys(rooms)
        });
    },
    "removeRoom": (client, request) => {
        if (request["roomID"]) {
            const roomId = request["roomID"].toString();
            if (rooms[roomId]) {
                rooms[roomId].removeAllMembers();
                rooms[roomId] = undefined;
                client.ok("Room " + roomId + " was created");
            } else {
                client.error("The specified room doesn't exist");
            }
        } else {
            client.error("No room to be deleted specified");
        }
    },
    "change": (client, request) => {
        if (client.room) {
            client.room.change(request);
        } else {
            client.error("You are in no room. Join a room to change a play state");
        }
    },
    "getUpdate": (client, request) => {
        if (client.room) {
            client.room.sendUpdateTo(client);
        } else {
            client.error("You are in no room. Join a room to get an update");
        }
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
                if (typeof value != "string" && typeof value != "number" && typeof value != "boolean" && typeof value != "object") {
                    return null;
                } else {
                    return value;
                }
            });
            if (request["name"]) {
                if (client.name != request["name"]) {
                    client.name = request["name"].toString();
                    client.ok("Hello " + client.name);
                }
            }
            if (request["action"]) {
                const action = request["action"].toString();
                if (actions[action]) {
                    actions[action](client, request);
                } else {
                    client.error("Unknown action " + action);
                }
            } else {
                client.error("You have to specify the action you want to do");
            }
        } catch (e) {
            //console.error("Client %s is not able to send properly formatted JSON!", client.name);
            console.error(e);
            client.error("Error: " + e.message);
        }
    });
});