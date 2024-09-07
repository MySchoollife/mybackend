import { Server, Socket } from "socket.io";
import * as Jwt from "jsonwebtoken";
import User from "../models/User";
import UserSocketController from "../controllers/App/UserSocketController";

export class SocketService {
  io: any;
  public sockets: any;
  public onlineUsers: any;
  public blockData: any;
  static activeSockets: any = [];

  constructor() {
    this.io;
    this.sockets = [];
    this.onlineUsers = [];
    this.blockData;
  }

  init(server) {
    this.io = new Server(server, {
      maxHttpBufferSize: 100000000,
      connectTimeout: 5000,
      transports: ["websocket", "polling"],
      pingInterval: 25 * 1000,
      pingTimeout: 5000,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
  }

  async provideSocket(id) {
    console.log("Provide Socket For ID", id);
    let userSocket = this.sockets[id];
    return userSocket;
  }

  globalSocket() {
    return this.io;
  }

  async connect() {
    //This middleware is used to validate the user using jwt token
    this.io.use(async (socket: Socket, next) => {
      try {
        const query: any = socket.handshake.query;
        const token: string = query.token;

        console.log("query ", JSON.stringify(socket.handshake.query));

        if (!token) {
          console.log("if token not present");
          // return next(new AppError('You are not logged in, please login again', RESPONSE.HTTP_UNAUTHORIZED));
        }

        Jwt.verify(token, "planit", async (err, decoded: any) => {
          console.log(decoded, "Decoded");
          if (err) {
            console.log(err);
          } else {
            let currentUser = await User.findById(decoded.id);
            if (currentUser) {
              currentUser.socketId = socket.id;
              await currentUser.save();
              socket.data.user = currentUser;
              console.log("currentUser Socket", currentUser);
              next();
            }
          }
        });
      } catch (error) {
        next(error);
      }
    });

    this.io.on("connection", async (socket: Socket) => {
      this.onlineUsers.push(socket?.id);
      console.log(socket, "socket");

      this.sockets[socket.data?.user?._id] = socket;

      socket.on("disconnect", async (data) => {
        console.log("User Disconnect.");
        let socket_key = this.getKeyByValue(this.sockets, socket);
        delete this.sockets[socket_key];
        this.onlineUsers.splice(this.onlineUsers.indexOf(socket.id), 1);
        console.log("Online Users After Disconnect", this.onlineUsers.length);
      });
    });
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find((key) => object[key] === value);
  }
}

let socketObj = new SocketService();
export default socketObj;
