/**
 *   communication mesage core
 *
 *   @copyright 2023 Bill.Liu .
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
import { MessageQueue } from "./memmsgq";

export interface IcommMsg {
  from: number;
  to: number;
  metadata?: any[];
}

export class Communication {
  private static MsgTable: Map<number, MessageQueue<IcommMsg>>;
  private static maxTableSize = 0;
  public static initialize(modules: number) {
    Communication.MsgTable = new Map();
    Communication.maxTableSize = modules;
  }
  public static Register(id: number, buffer_size: number) {
    return new Promise<boolean>((resolve) => {
      if (
        Communication.MsgTable.size < Communication.maxTableSize ||
        Communication.MsgTable.get(id) != undefined
      ) {
        const Msg = new MessageQueue<IcommMsg>(buffer_size);
        Communication.MsgTable.set(id, Msg);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  public sendMsg(Msg: IcommMsg) {
    const msgq = Communication.MsgTable.get(Msg.to);
    if (undefined != msgq) {
      return msgq.sendMsg([Msg]);
    } else {
      return Promise.resolve(-1);
    }
  }
  public recvMsg(Msg: IcommMsg, msTimeOut: number) {
    const msgq = Communication.MsgTable.get(Msg.to);
    if (undefined != msgq) {
      return msgq.recvMsg([Msg], msTimeOut);
    } else {
      return Promise.resolve(-1);
    }
  }
}
