import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { WebSocketClient } = require("eventstore-tools/src/WebSocketClient.js");

const esserver = "ws://127.0.0.1:8080/";
const client = new WebSocketClient(esserver);

let allMessages = 0;

function getBooks(limit = 4) {
  return new Promise((resolve) => {
    const items = [];
    const timer = setTimeout(() => {
      console.log("TIMEOUT, items:", items.length, "allMessages:", allMessages);
      resolve(items);
    }, 15000);

    client.connect().then(() => {
      console.log("connected:", client.connected);
      const event = {
        ops: "R",
        code: 203,
        limit,
        offset: 0,
        tags: [["t", "create_book"], ["web", "esbook"]],
      };
      const reqId = client.subscribe(event, (message) => {
        allMessages++;
        console.log("CALLBACK:", JSON.stringify(message).slice(0, 200));
        if (message[2] === "EOSE") {
          clearTimeout(timer);
          client.unsubscribe(message[1]);
          resolve(items);
        } else if (message[2]) {
          items.push(message[2]);
        }
      });
      console.log("subscribe reqId:", reqId, "subCallbacks size:", client.subCallbacks?.size);
    }).catch((e) => {
      console.error("connect failed:", e);
      clearTimeout(timer);
      resolve(items);
    });
  });
}

// Monkey-patch to log all raw messages
const origConnect = client.connect.bind(client);
client.connect = async function() {
  const result = await origConnect();
  if (client.socket) {
    client.socket.on("message", (raw) => {
      console.log("RAW WS:", raw.toString().slice(0, 300));
    });
  }
  return result;
};

const books = await getBooks();
console.log("RESULT:", books.length);
