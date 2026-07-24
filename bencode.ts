interface IdxObjInterface {
    idx: number;
}

const txtEncoder = new TextEncoder();

const bencodeBytes = (bytes: Uint8Array) => {
    const res: number[] = [];
    res.push(...txtEncoder.encode(`${bytes.length}:`));
    res.push(...bytes);
    return res;
}

const bencodeStr = (str: string) => {
    const res: number[] = [];
    res.push(...txtEncoder.encode(`${str.length}:${str}`));
    return res;
}

const bencodeNum = (num: number) => {
    const res: number[] = [];
    res.push(...txtEncoder.encode(`i${num}e`));
    return res;
}

const bencodeList = (arr: (string | number | [] | Record<string, any>)[]) => {
    const res: number[] = [108];
    arr.forEach(el => {
        if (typeof (el) === "string") {
            res.push(...bencodeStr(el));
        } else if (typeof (el) === "number") {
            res.push(...bencodeNum(el));
        } else if (el instanceof Uint8Array) {
            res.push(...bencodeBytes(el));
        } else if (Array.isArray(el)) {
            res.push(...bencodeList(el));
        } else if (typeof (el) === "object") {
            res.push(...bencodeDictionary(el));
        }
    });
    res.push(101);
    return res;
}

const bencodeDictionary = (obj: Record<string, any>) => {
    const res: number[] = [100];

    const sortedObj = Object.entries(obj)
        .sort()
        .reduce((acc: any, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {})

    for (const key in sortedObj) {
        // console.log(key, obj[key]);
        res.push(...bencodeStr(key));
        if (typeof (sortedObj[key]) === "string") {
            res.push(...bencodeStr(sortedObj[key]));
        } else if (typeof (sortedObj[key]) === "number") {
            res.push(...bencodeNum(sortedObj[key]));
        } else if (sortedObj[key] instanceof Uint8Array) {
            res.push(...bencodeBytes(sortedObj[key]));
        } else if (Array.isArray(sortedObj[key])) {
            res.push(...bencodeList(sortedObj[key]));
        } else if (typeof (sortedObj[key]) === "object") {
            res.push(...bencodeDictionary(sortedObj[key]));
        }
    }

    res.push(101);
    return res;
}

export const encode = (input: string | number | string[] | number[] | Record<string, any>): Uint8Array => {
    if (typeof (input) === "string") {
        return new Uint8Array(bencodeStr(input));
    } else if (typeof (input) === "number") {
        return new Uint8Array(bencodeNum(input));
    } else if (input instanceof Uint8Array) {
        return new Uint8Array(bencodeBytes(input));
    } else if (Array.isArray(input)) {
        return new Uint8Array(bencodeList(input));
    } else if (typeof (input) === "object") {
        return new Uint8Array(bencodeDictionary(input));
    }

    throw Error("Invalid input");
}

const txtDecoder = new TextDecoder();

const bdecode = (bytes: Uint8Array, idxObj: IdxObjInterface): any => {
    if (bytes[idxObj.idx] >= 48 && bytes[idxObj.idx] <= 57) {
        let num = 0;
        while (bytes[idxObj.idx] >= 48 && bytes[idxObj.idx] <= 57) {
            num = num * 10 + bytes[idxObj.idx] - 48;
            idxObj.idx++;
        }
        if (bytes[idxObj.idx] !== 58) {
            throw new Error(`error at position ${idxObj.idx}`);
        }
        idxObj.idx++;
        const decodedText = txtDecoder.decode(bytes.subarray(idxObj.idx, idxObj.idx + num));
        idxObj.idx += num;
        return decodedText;
    } else if (bytes[idxObj.idx] === 105) {
        idxObj.idx++;
        let num = 0;
        while (bytes[idxObj.idx] >= 48 && bytes[idxObj.idx] <= 57) {
            num = num * 10 + bytes[idxObj.idx] - 48;
            idxObj.idx++;
        }
        if (bytes[idxObj.idx] !== 101) {
            throw new Error(`error at position ${idxObj.idx}`);
        }
        idxObj.idx++;
        return num;
    } else if (bytes[idxObj.idx] === 108) {
        idxObj.idx++;
        const arr = [];
        while (bytes[idxObj.idx] !== 101) {
            arr.push(bdecode(bytes, idxObj));
        }
        idxObj.idx++;
        return arr;
    } else if (bytes[idxObj.idx] === 100) {
        idxObj.idx++;
        const obj: Record<string, any> = {};
        while (bytes[idxObj.idx] !== 101) {
            const key = bdecode(bytes, idxObj);
            let val;
            if (key === "pieces") {
                let num = 0;
                while (bytes[idxObj.idx] >= 48 && bytes[idxObj.idx] <= 57) {
                    num = num * 10 + bytes[idxObj.idx] - 48;
                    idxObj.idx++;
                }
                if (bytes[idxObj.idx] !== 58) {
                    throw new Error(`error at position ${idxObj.idx}`);
                }
                idxObj.idx++;
                const uint8arr = bytes.subarray(idxObj.idx, idxObj.idx + num);
                idxObj.idx += num;
                val = uint8arr;
            } else {
                val = bdecode(bytes, idxObj);
            }
            obj[key] = val;
        }
        idxObj.idx++;
        return obj;
    } else {
        throw new Error(`error at position ${idxObj.idx}`);
    }
}

export const decode = (bytes: Uint8Array) => {
    return bdecode(bytes, { idx: 0 });
}

// function main() {
//     const s = "asdfghjkl";
//     const n = 98;
//     const l = ["fghjkl", "ghjkl", "fghjki"];
//     const o = {
//         "Coding Challenges": {
//             "website": "codingchallenges.fyi",
//             "Rating": "Awesome"
//         },
//         "hloworld": {
//             "corkoran": "fal4acy",
//             "age": 100,
//         }
//     }
//     // console.log(bencodeStr(s));
//     // console.log(bencodeNum(n));
//     // console.log(bencodeList(l));
//     const str = encode(o);
//     console.log(str);
//     console.log(JSON.stringify(decode(str), null, 2));
// }

// main();