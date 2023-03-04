import { WorldServer } from './worldServer';
import { createServer } from "http";
import { Server } from "socket.io";


//var msg: string = "🧙 sheep the priest🐑"
//console.log(msg)

function Main() {
  const port = process.env.PORT || 3000;

  const server = createServer();
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  server.listen(port, () => {
    console.log("listening on: *", port);
  });

  const _WORLD = new WorldServer(io);
  _WORLD.Run();
}

Main();