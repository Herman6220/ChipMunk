import {file, SHA1} from "bun";
import * as bencode from "./bencode";

const PORT = 6881;

const torrentFile = file("./test.torrent");

const bytes = new Uint8Array(await torrentFile.arrayBuffer());

const decoded = bencode.decode(bytes);

console.log(decoded.info.files);

const sha1Hasher = new SHA1();
const infoBytes = bencode.encode(decoded.info);
const infoHash = sha1Hasher.update(infoBytes).digest();
console.log(infoHash);


const genPeerId = () => {
    const prefix = "-CM1000-";
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";

    let id = prefix;
    for(let i = 0; i<12; i++){
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

const peerId = genPeerId();

const left = decoded.info.files.reduce((sum: any, file: any) => sum + file.length, 0);
console.log(left);

// const getPeers = async () => {
//     console.log(`${decoded.announce}?info_hash=${infoHash}&peer_id=${peerId}&port=${PORT}&uploaded=0&downloaded=0&left=${left}`);
//     const response = await fetch(`${decoded.announce}?info_hash=${infoHash}&peer_id=${peerId}&port=${PORT}&uploaded=0&downloaded=0&left=${left}`);
//     const data = await response.json();
//     console.log(data);
// }

// getPeers();