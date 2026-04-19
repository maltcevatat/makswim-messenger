import { EventEmitter } from "events";

export const chatEmitter = new EventEmitter();
chatEmitter.setMaxListeners(1000);
