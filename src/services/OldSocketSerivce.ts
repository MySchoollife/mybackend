import { Server, Socket } from "socket.io";
import * as Jwt from "jsonwebtoken";
import User from "../models/User";
import { ChatController } from "../controllers/chat/ChatController";

export class SocketServiceOld {
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

        Jwt.verify(token, "tawasi", async (err, decoded:any) => {
          console.log(decoded, "Decoded");
          if (err) {
            console.log(err);
          } else {
            let currentUser = await User.findById(decoded.id);
            socket.data.user = currentUser;
            console.log("currentUser", currentUser);
            next();
          }
        });
      } catch (error) {
        next(error);
      }
    });


    this.io.on("connection", async (socket: Socket) => {
      this.onlineUsers.push(socket.id);
      this.sockets[socket.data.user._id] = socket;
      
      // First Method

      // @api {emit} sendMessage Send Message

      /**
       *
       *@apiVersion 1.0.0
       *@apiGroup Chat
       *@apiParamExample Normal-Request-Body :
       *{"receiverId":"61d6761387193919815d163e","message":"message 1","message_type":"TEXT"}
      **/

       
      // @api {listen} receiveMessage Receive Message
      /**
       *
       *@apiVersion 1.0.0
       *@apiGroup Chat
      **/

      socket.on("sendMessage", (data, callback) => {
        let memberSocket = null;
        data.senderId = socket.data.user._id;
        memberSocket = data.receiverId || null;
        ChatController.sendMessage(data, callback, memberSocket, this.io);
      });

      // Second Method
      
      // @api {emit} chatHistory Chat History
      /**
       *
       *@apiVersion 1.0.0
       *@apiGroup Chat
       *@apiParamExample Normal-Request-Body :
       *{"receiverId":"622eec5075f7674b7cd5e86f"}
      **/

      socket.on("chatHistory", (data, callback) => {
        let memberSocket = null;
        data.senderId = socket.data.user._id;
        ChatController.chatHistory(data, callback);
      });

      // Third Method

      // @api {emit} chatList Chat List

      /**
       *
       *@apiVersion 1.0.0
       *@apiGroup Chat
       *@apiParamExample Normal-Request-Body :
       * {"page":1,"limit":50,"search_text":"Hello"}
      **/
     
      socket.on("chatList", (data, callback) => {
        console.log("socketData", socket.data);
        let memberSocket = null;
        data.senderId = socket.data.user._id;
        data.user = socket.data.user;
        ChatController.chatList(data, callback, socket);
      });


      // Fourth Method

      // @api {emit} readMessage Read Message

      /**
       *
       *@apiVersion 1.0.0
       *@apiGroup Chat
       *@apiParamExample Normal-Request-Body :
       *{"chat_id":"624c3c75d0fbc248442c4357"}
      **/

      socket.on("readMessage", (data, callback) => {
        console.log("socketData", socket.data);
        ChatController.readMessage(data, callback);
      });

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

let socketObjOld = new SocketServiceOld();
export default socketObjOld;
