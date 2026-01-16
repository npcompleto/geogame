import { io } from "socket.io-client";

// In dev, usage of localhost:3000. In prod, auto-detect or configure.
const URL = "http://localhost:3000";

const socket = io(URL, {
    autoConnect: false
});

export default socket;
