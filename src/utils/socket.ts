/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private readonly url: string;
  private readonly socketConfig: object

  constructor(url: string, socketConfig:object) {
    this.url = url;
    this.socketConfig = socketConfig
  }

  public connect() {
    this.socket = io(this.url, this.socketConfig);

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  public on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  public emit(event: string, ...args: any[]) {
    if (this.socket) {
      this.socket.emit(event, ...args);
    }
  }
}

export default new SocketService('http://localhost:3000',{
    transports: ['websocket', 'polling', 'flashsocket'],

    cors: {

        origin: "http://localhost:3000",

        credentials: true

    },

    withCredentials: true
});
