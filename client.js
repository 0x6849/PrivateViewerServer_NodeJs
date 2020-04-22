class Client {

    socket;
    name;
    room;

    constructor(socket) {
        this.socket = socket;
        this.name = "unnamed";
        this.room = null;
    }

    joinRoom(newRoom) {
        if (this.room == newRoom) {
            this.warning("You are already in this room");
        } else {
            if (this.room) {
                this.room.removeMember(this);
                this.ok("Changed from room " + this.room.id + " to room " + newRoom.id);
            } else {
                this.ok("Entered room " + newRoom.id);
            }
            this.room = newRoom;
            this.room.addMember(this);
            this.room.sendUpdateTo(this);
        }
    }

    leaveRoom() {
        if (this.room) {
            this.room.removeMember(this);
            client.ok("You left the room " + this.room.id);
        } else {
            client.warning("You weren't in any room");
        }
        this.room = null;
    }

    warning(msg) {
        this.send({
            "result": "warning",
            "message": msg
        });
        console.error("WARNING to " + this.name + ": " + msg);
    }

    error(msg) {
        this.send({
            "result": "error",
            "message": msg
        });
        console.error("ERROR to " + this.name + ": " + msg);
    }

    ok(msg) {
        this.send({
            "result": "ok",
            "message": msg
        });
        console.log("OK to " + this.name + ": " + msg);
    }

    send(data) {
        this.checkOpen();
        const dataStr = JSON.stringify(data);
        this.socket.send(dataStr);
        console.log("Sent " + dataStr + " to " + this.name);
    }

    checkOpen() {
        if (this.socket.readyState != 1) {
            console.log(this.name + " has ready state " + this.socket.readyState);
            throw new Error("Socket is no longer open");
        }
    }
}

module.exports = Client;