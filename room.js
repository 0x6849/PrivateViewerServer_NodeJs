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

    change(newState) {
        const startTimer = false;
        if (newState["paused"] !== undefined) {
            const newPaused = newState["paused"];
            if (newPaused === true || newPaused === false) {
                if (newPaused === false && this.paused === true) {
                    startTimer = true;
                }
                this.paused = newPaused;
            }
        }
        if (newState["timeStamp"] !== undefined) {
            const newTime = parseFloat(newState["timeStamp"]);
            if (isFinite(newTime) && newTime >= 0) {
                this.currentTime = newTime;
            }
        }
        if (newState["playSpeed"] !== undefined) {
            const newSpeed = parseFloat(newState["playSpeed"]);
            if (isFinite(newSpeed) && newSpeed >= 0) {
                this.speed = newSpeed;
            }
        }
        if (newState["jump"] !== undefined) {
            const jumpInterval = parseFloat(newState["jump"]);
            if (isFinite(jumpInterval) && jumpInterval >= -this.currentTime) {
                this.currentTime += jumpInterval;
            }
        }
        if (!this.paused) {
            if (startTimer) {
                this.lastUpdated = new Date();
            } else {
                this.updateTime();
            }
        }

        this.sendUpdateToAll();
    }

    updateTime() {
        if (!this.paused) {
            const currTime = new Date();
            this.currentTime += ((currTime - this.lastUpdated) / 1000.0 / this.speed);
            this.lastUpdated = currTime;
        }
    }

    sendUpdateToAll() {
        const self = this;
        this.updateTime();
        this.members.forEach(client => {
            self.sendUpdateTo(client, true);
        });
    }

    sendUpdateTo(client, multi) {
        this.updateTime();
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