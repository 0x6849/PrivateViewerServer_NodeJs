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
                client.warning("The specified room is unknown");
                const roomId = actions["createRoom"](client, request);
                if (roomId) {
                    client.joinRoom(rooms[roomId]);
                    client.ok("Joined room " + roomId);
                } else {
                    client.error("Couldn't join room");
                }
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
                return roomId;
            } else {
                client.error("The specified room id already exists");
                return null;
            }
        } else {
            client.waring("No room id specified. Creating random...");
            var randomString = "";
            var tries = 0;
            while ((randomString != "" || rooms[randomString]) && tries < 200) {
                randomString = btoa(Math.random()).substr(0, 11);
                tries++;
            }
            if (!rooms[randomString]) {
                rooms[randomString] = new Room(randomString);
                client.ok("Room " + randomString + " was created");
                return randomString;
            } else {
                client.ok("No free random string was found. No room created");
                return null;
            }
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
    ws.on('message', function incoming(message) {
        if (settings.logLevel >= 9) {
            console.log("received: %s from %s", message, client.name);
        }
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
            if (settings.logLevel >= 1) {
                console.error(e);
            }
            client.error("Error: " + e.message);
        }
    });
});

setInterval(() => {
    var deleteIdx = []
    for (var i = 0; i < clients.length; i++) {
        if (!clients[i].checkOpen()) {
            deleteIdx.push(i);
        }
    }
    deleteIdx.forEach(i => {
        clients.splice(i, 1);
    });
    for (const roomId in rooms) {
        if (rooms.hasOwnProperty(roomId)) {
            const room = rooms[roomId];
            room.sendUpdateToAll();
        }
    }
}, 1000);