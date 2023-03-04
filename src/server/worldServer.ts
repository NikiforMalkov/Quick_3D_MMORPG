import { performance } from "perf_hooks";
import { Server, Socket } from "socket.io";
import { LoginQueue, LoginQueueInteface, OnLoginParams } from "./loginQueue";
import { WorldManager, WorldManagerInterface } from "./worldManager";

export interface SocketWrapperInterface {
  onMessage:any;
  get ID():string
  get IsAlive():boolean
  SetupSocket_(): void
  Disconnect(): void
  Send(msg:string, data:any): void
}

class SocketWrapper implements SocketWrapperInterface {

  socket_:Socket;
  onMessage:any;
  dead_:boolean;

  constructor(socket: Socket ) {
    this.socket_ = socket;
    this.onMessage = null;
    this.dead_ = false;
    this.SetupSocket_();
  }

  get ID(): string {
    return this.socket_.id;
  }

  get IsAlive():boolean {
    return !this.dead_;
  }

  SetupSocket_() {
    this.socket_.on("user-connected", () => {
      console.log("socket.id: " + this.socket_.id);
      //console.log("socket.id: " + socket.id);
    });
    this.socket_.on("disconnect", () => {
      console.log("Client disconnected.");
      this.dead_ = true;
    });
    this.socket_.onAny((e:any, d:any) => {
      try {
        if (!this.onMessage(e, d)) {
          console.log("Unknown command (" + e + "), disconnected.");
          this.Disconnect();
        }
      } catch (err) {
        console.error(err);
        this.Disconnect();
      }
    });
  }

  Disconnect() {
    this.socket_.disconnect(true);
  }

  Send(msg:string, data:any) {
    this.socket_.emit(msg, data);
  }
}

export interface WorldServerInterface {
  SetupIO_(io:Server): void
  OnLogin_(client:SocketWrapperInterface, params:OnLoginParams): void
  Run(): void
  Schedule_(t1:number): void
  Update_(timeElapsed:number): void
}

export class WorldServer implements WorldServerInterface {

  loginQueue_:LoginQueueInteface;
  worldMgr_: WorldManagerInterface;

  constructor(io:Server) {
    this.loginQueue_ = new LoginQueue((c:SocketWrapperInterface, p:OnLoginParams) : void => {
      this.OnLogin_(c, p);
    });

    this.worldMgr_ = new WorldManager(this);
    this.SetupIO_(io);
  }

  SetupIO_(io:Server) {
    io.on("connection", (socket:Socket) => {
      this.loginQueue_.Add(new SocketWrapper(socket));
    });
  }

  //client:SocketWrapperInterface, params:{ accountName: 'test' }
  OnLogin_(client:SocketWrapperInterface, params:OnLoginParams) {
    this.worldMgr_.Add(client, params);
  }

  Run() {
    let t1 = performance.now();
    this.Schedule_(t1);
  }

  Schedule_(t1:number) {
    setTimeout(() => {
      let t2 = performance.now();
      this.Update_((t2 - t1) * 0.001);
      this.Schedule_(t2);
    });
  }

  Update_(timeElapsed:number) {
    this.worldMgr_.Update(timeElapsed);
  }
}
