class Room {
    id;
    members = [];
    currentTime = 0.0;
    paused = true;
    speed = 1.0;
    lastUpdated = 0;

    constructor(id) {
        this.id = id;
    }

    sendUpdateToAll() {
        const self = this;
        this.members.forEach(client => {
            self.sendUpdateTo(client);
        });
    }

    sendUpdateTo(client) {
        client.send({
            "roomID": this.id,
            "paused": this.paused,
            "timeStamp": this.currentTime,
            "playSpeed": this.speed,
            "action": "change",
            "result": "ok"
        });
    }

    addMember(client) {
        var found = false;
        this.members.forEach(member => {
            if (client == member) {
                found = true;
            }
        });
        if (!found) {
            this.members.push(client);
        }
    }

    removeMember(client) {
        var index = -1;
        for (var i = 0; i < this.members.length; i++) {
            if (client == this.members[i]) {
                index = i;
            }
        };
        this.members.splice(i, 1);
    }

    revokeAllMembers() {
        this.members.forEach(client => {
            client.room = null;
        });
        this.members = [];
    }
}

module.exports = Room;