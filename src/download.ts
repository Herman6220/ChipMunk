import net from "net";
import { genHandshakeRequest } from "..";
import { PROTOCOL_STRING } from "../constants";

interface IPeer {
    ip: string;
    port: number;
}

export function download(peer: IPeer) {
    const socket = new net.Socket();
    socket.on("error", (error) => {
        console.log(error);
    })
    socket.connect(peer.port, peer.ip, () => {
        console.log("Established connection with:", peer.ip);
        socket.write(genHandshakeRequest());
    })
    socket.on("data", (msg) => {
        console.log("Peer Sent:", msg);
        if (Buffer.isBuffer(msg)) {
            if (isHandshake(msg)) {

            } else {

            }
        }
    })
}

function isHandshake(msg: Buffer) {
    return (
        msg.length === msg.readUint8(0) + 49 
        && msg.toString("utf-8", 1) === PROTOCOL_STRING
    )
}

function messageParser(msg: Buffer){
    
}