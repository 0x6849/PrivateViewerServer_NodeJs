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
    }

    error(msg) {
        this.checkOpen();
        this.socket.send(JSON.stringify({
            "result": "error",
            "message": msg
        }));
    }

    ok(msg) {
        this.checkOpen();
        this.socket.send(JSON.stringify({
            "result": "ok",
            "message": msg
        }));
    }

    checkOpen() {
        if (this.socket.readyState == 1) {
            throw new Error("Socket is no longer open");
        }
    }
}

module.exports = Client;