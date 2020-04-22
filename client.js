class Client {

    socket;
    name;
    room;

    constructor(socket) {
        this.socket = socket;
        this.name = "unnamed";
        this.room = null;
    }

    warning(msg) {
        this.checkOpen();
        this.socket.send(JSON.stringify({
            "result": "warning",
            "message": msg
        }));
        console.error("WARNING to" + this.name + ": " + msg);
    }

    error(msg) {
        this.checkOpen();
        this.socket.send(JSON.stringify({
            "result": "error",
            "message": msg
        }));
        console.error("ERROR to" + this.name + ": " + msg);
    }

    ok(msg) {
        this.checkOpen();
        this.socket.send(JSON.stringify({
            "result": "ok",
            "message": msg
        }));
        console.log("OK to" + this.name + ": " + msg);
    }

    checkOpen() {
        if (this.socket.readyState != 1) {
            console.log(this.name + " has ready state " + this.socket.readyState);
            throw new Error("Socket is no longer open");
        }
    }
}

module.exports = Client;