const fs = require('fs');
const https = require('https');
const websocket = require("ws");
const Client = require("./client");

const credentials = { key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem') };

var httpsServer = https.createServer(credentials);
httpsServer.listen(25565);

var wss = new websocket.Server({
    server: httpsServer
});

const actions = {
    "join": (client, request) => {
        if (request["roomID"]) {
            if (rooms[request["roomID"]]) {
                if (client.room == request["roomID"]) {
                    client.warning("You are already in this room");
                    //TODO: Send update on join
                } else if (!client.room) {
                    client.room = request["roomID"];
                    client.ok("Entered room " + client.room);
                } else {
                    client.ok("Changed from room " + client.room + " to room " + request["roomID"]);
                    client.room = request["roomID"];
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
        if (client.room == request["roomID"]) {
            client.ok("You left the room " + client.room);
        } else {
            client.error("You are in no room");
        }
    },
    "createRoom": (client, request) => {

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
var rooms = [];

wss.on('connection', function connection(ws) {
    var client = new Client(ws);
    clients.push(client);
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
                    actions[request["action"]]();
                } else {
                    client.error("Unknown action " + request["action"]);
                }
            } else {
                client.error("You have to specify the action you want to do");
            }
        } catch (e) {
            console.error("Client %s is not able to send properly formatted JSON!", client.name);
            console.log(e);
            client.error("Malformatted JSON");
        }
    });
});