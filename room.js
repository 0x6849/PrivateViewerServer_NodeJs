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
        var changed = false;
        if (newState["paused"] !== undefined) {
            const newPaused = newState["paused"];
            if (newPaused === true || newPaused === false) {
                if (newPaused != this.paused) {
                    changed = true;
                }
                this.paused = newPaused;
            }
        }
        if (!this.paused) {
            if (changed) {
                this.lastUpdated = new Date();
            } else {
                this.updateTime();
            }
        } else {
            if (changed) {
                this.updateTime();
            }
        }
        if (newState["timeStamp"] !== undefined) {
            const newTime = parseFloat(newState["timeStamp"]);
            if (isFinite(newTime) && newTime >= 0) {
                this.currentTime = newTime;
            }
        }
        if (newState["jump"] !== undefined) {
            const jumpInterval = parseFloat(newState["jump"]);
            if (isFinite(jumpInterval) && jumpInterval >= -this.currentTime) {
                this.currentTime += jumpInterval;
            }
        }
        if (newState["playSpeed"] !== undefined) {
            const newSpeed = parseFloat(newState["playSpeed"]);
            if (isFinite(newSpeed) && newSpeed >= 0) {
                this.speed = newSpeed;
            }
        }

        this.sendUpdateToAll();
    }

    updateTime() {
        const currTime = new Date();
        this.currentTime += ((currTime - this.lastUpdated) / 1000.0 * this.speed);
        this.lastUpdated = currTime;
    }

    sendUpdateToAll() {
        const self = this;
        if (!this.paused) {
            this.updateTime();
        }
        this.members.forEach(client => {
            self.sendUpdateTo(client, true);
        });
    }

    sendUpdateTo(client, multi) {
        if (!this.paused) {
            this.updateTime();
        }
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
        if (index != -1) {
            this.members.splice(index, 1);
        }
    }

    revokeAllMembers() {
        this.members.forEach(client => {
            client.room = null;
        });
        this.members = [];
    }
}

module.exports = Room;