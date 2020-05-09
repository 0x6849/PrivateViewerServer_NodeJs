# PrivateViewerServer_NodeJs
A Server for the PrivateViewer video watching written in NodeJS with sockets

# Protocol specification
The protocol is based on JSON-Messages
## Client -> Server
### `action` _(required)_
The action must be given and specifies what the message intends
Possible client actions:
- `join`: Joins the room specified; see [Join room](#join-room)
- `leave`: Leves the current room; see [Leave room](#leave-room)
- `createRoom`: Creates a new room; see [Create room](#create-room)
- `listRooms`: Returns the List of currently existing rooms
- `removeRoom`: Deletes the specified Room; see [Remove room](#remove-room)
- `change`
- `getUpdate`
- `transcript`: Send transcript text; see [Send transcript data](#send-transcript-data)
- `saveTranscript`: Save the current transcript into a new file; see [Save transcript](#save-transcript)
- `loadsTranscript`: Loads a saved transcript from file or an empty transcript; see [Load transcript](#load-transcript)
### `name` _(optional)_
The name of the client. Used to be able to identify messages from/to this client in the server log.
Name-guidlines (not obligatory): "SoftwareName-SoftwareVerion-PlatformOrOS-UniqueIdOrTimestamp"

## Server -> Client
All valid server responses will always contain a `result`
### `result` _(required)_
Possible results:
- `ok`: Everything worked as intended; the request could be successfully fullfilled
- `error`: There was an error either in the request or on the server side and the request couldn't be fullfilled. Details will be specified in the `message`field
- `warning`: There was a minor problem in the problem on the server on in the request, but the server still tried to fullfill the request as well as possible. Details can be found in the `message` field if available.
### `message` _(optional)_
Gives additional info what happened on the server as a String. Not always present but can be present for all messages from the server

## Rooms
A room is one "container" in which all features of the Private Viewer are available. Each room has separate timecode, speed etc. settings. Rooms can be created, destroyed, joined and left at any point in time.
### Create room
Request:
```javascript
{
    "action": "createRoom",
    "roomID": "RoomName"
}
```
Creates a new room with the given id. If a room with that exact id already exists, the request will result in an error response. If no id was given a warning specifies that no id was given and it will be attemted to create a random id. If this succeeds, the room will be created, otherwise an error will be returned.
### Remove room
Request:
```javascript
{
    "action": "removeRoom",
    "roomID": "RoomName"
}
```
The room with the specified name will be deleted. All members of that room will be force-leaved beforehand. The current status (timecode, speed, etc) of that room will be lost! There is no confirmation.
If the room doesn't exist or no roomID is specified, the result will be an error.
### Join room
Request:
```javascript
{
    "action": "join",
    "roomID": "RoomName"
}
```
Joins the client sending the message into the room specified. If the room specified doesn't exist, a warning telling that the room doesn't exist will be sent and the room will be created before joining the client into it. If no roomID is specified, an error will be retuned.
### Leave room
Request:
```javascript
{
    "action": "leave"
}
```
Removed the sending client from the room they were currently in. If in no room, an error will be returned.

## Transcript
### Speak events
Structure:
```javascript
{
    "text": "[Audio as text]",
    "start": 0, //start time of transcript in seconds
    "end": 0, //end time of transcript in seconds
    "speaker": "[uniqueNameOfSpeaker]",
    "id": 0 //unique, never changing id of this speak-event; may only be given by server
}
```
### Send transcript data
Request:
```javascript
{
    "action": "transcript",
    "addEvents" [],// list of speak-events to be added to the transcript
    "removeEvents": [],// list of speak-event-ids to be removed from the transcript
}
```
Sends transcript text data for the given time to the server. Server will return all events including ids that were added and removed.
Response:
```javascript
{
    "action": "transcript",
    "addEvents": []// list of events added including ids
    "removeEvents": [] //list of events removed including ids
}
```
### Save transcript
Request:
```javascript
{
    "action": "saveTranscript",
    "fileName": "filename of transcript"
}
```
Saves the currently loded transcript to a file with the given name. Renames the new file if a file with that name already existed.
### Load transcript
Request:
```javascript
{
    "action": "loadTranscript",
    "fileName": "filename of transcript"
}
```
Loads the given transcript into the current room if it exists. If file doesn't exist or filename isn't given or empty, a empty transcript will be loaded into the room.
### Get transcript
Request:
```javascript
{
    "action": "getTranscript"
}
```
Returns the full transcript of the current room as a list of "speek-events"
Response:
```javascript
{
    "result": "ok",
    "action": "getTranscript",
    "events": [] //list of transcript events in current room sorted by time
}
```
### List transcripts
Request:
```javascript
{
    "action": "listTranscripts"
}
```
Returns a list of all currently available transcripts saved.
Response:
```javascript
{
    "result": "ok",
    "action": "listTranscripts",
    "transcripts": [
        "fileName",
        "fileName2"
    ]
}
```
