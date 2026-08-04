import { file } from "bun";
import crypto from "crypto";
import dgram from "dgram";
import * as bencode from "./bencode";
import { PROTOCOL_ID } from "./constants";

const torrentFile = file("./test.torrent");

const bytes = new Uint8Array(await torrentFile.arrayBuffer());

const decoded = bencode.decode(bytes);

const announceUrl = new URL("udp://tracker.opentrackr.org:1337");
// console.log(decoded);

const PORT = 41234;
const transactionId = crypto.randomBytes(4).readUInt32BE(0);
const key = crypto.randomBytes(4).readUInt32BE(0);
let connectionId: bigint;

const genConnectionRequest = () => {
    const buf = Buffer.alloc(16);
    buf.writeBigUInt64BE(PROTOCOL_ID, 0);
    buf.writeUInt32BE(0, 8);
    buf.writeUInt32BE(transactionId, 12);
    return buf;
}

const genAnnounceRequest = () => {
    const infoBytes = bencode.encode(decoded.info);
    const infoHash = crypto.createHash("sha1").update(infoBytes).digest();
    // console.log(infoHash);


    const genPeerId = () => {
        const prefix = "-CM1000-";
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

        let id = prefix;
        for (let i = 0; i < 12; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }

    const peerId = Buffer.from(genPeerId());

    const left: bigint = BigInt(decoded.info.files.reduce((sum: any, file: any) => sum + file.length, 0));
    console.log("Left: ", left);

    const buf = Buffer.alloc(98);
    buf.writeBigUInt64BE(connectionId, 0); // connection
    buf.writeUint32BE(1, 8); // action: 1 / announce 
    buf.writeUint32BE(transactionId, 12);
    infoHash.copy(buf, 16);
    peerId.copy(buf, 36);
    buf.writeBigUInt64BE(0n, 56); // downloaded
    buf.writeBigUInt64BE(left, 64); // left
    buf.writeBigUInt64BE(0n, 72); // uploaded
    buf.writeUInt32BE(0, 80); // event   0 // 0: none; 1: completed; 2: started; 3: stopped
    buf.writeUInt32BE(0, 84); // IP address 0 // default
    buf.writeUint32BE(key, 88);
    buf.writeInt32BE(-1, 92); // num_want  -1 // default
    buf.writeUint16BE(PORT, 96);

    return buf;
}



const server = dgram.createSocket("udp4");
server.bind(PORT);

server.on('error', (err) => {
    console.error(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, rinfo) => {
    console.log(`server got: ${msg} of length ${msg.length} from ${rinfo.address}:${rinfo.port}`);

    const action = msg.readUint32BE(0);
    const trnscId = msg.readUint32BE(4);

    if (trnscId !== transactionId) return;

    switch (action) {
        case 0:
            if (msg.length < 16) break;
            const connId = msg.readBigUInt64BE(8);
            connectionId = connId;
            console.log(connectionId);

            server.send(genAnnounceRequest(), parseInt(announceUrl.port), announceUrl.hostname, () => {
                console.log("Sent announce request.");
                console.log(announceUrl.hostname);
                console.log(announceUrl.port);
            })

            break;
        case 1:
            if (msg.length < 20) break;
            const interval = msg.readUint32BE(8);
            const leechers = msg.readUint32BE(12);
            const seeders = msg.readUint32BE(16);

            const peers = [];

            for(let offset = 20; offset < msg.length; offset += 6){
                const peerIpAdd = msg.readUint32BE(offset);
                const peerTcpPort = msg.readUint16BE(offset + 4);

                peers.push({peerIpAdd, peerTcpPort});
            }

            console.log(peers);

            break;
    }
});

server.on('listening', () => {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});


server.send(genConnectionRequest(), parseInt(announceUrl.port), announceUrl.hostname, () => {
    console.log("Sent connection request.");
    console.log(announceUrl.hostname);
    console.log(announceUrl.port);
})