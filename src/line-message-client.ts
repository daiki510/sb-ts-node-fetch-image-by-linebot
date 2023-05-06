import { Client, TextMessage, MessageEvent } from '@line/bot-sdk';
import { load } from 'ts-dotenv';
import * as fs from 'fs';
// import axios from 'axios';

const env = load({
  CHANNEL_ACCESS_TOKEN: String,
  CHANNEL_SECRET: String,
  BASE_URL: String,
  PORT: Number,
  USER_ID_LIST: String,
});

interface LineMessagingClientConfig {
  channelAccessToken: string;
  channelSecret: string;
}

export default class LineMessagingClient {
  private client: Client;

  constructor() {
    const config = {
      channelAccessToken: env.CHANNEL_ACCESS_TOKEN || '',
      channelSecret: env.CHANNEL_SECRET,
    };
    this.client = new Client(config);
  }

  public async sendMessage(event: MessageEvent, text: string): Promise<void> {
    const { replyToken } = event;
    const response: TextMessage = { type: 'text', text: text };
    await this.client.replyMessage(replyToken, response);
  }

  public async fetchImageByStream(messageId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.getMessageContent(messageId).then((stream) => {
        const chunks: Buffer[] = [];

        stream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        stream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          fs.writeFileSync('./sample.jpg', buffer);
          resolve();
        });

        stream.on('error', (err) => {
          reject(err);
        });
      });
    });
  }

  // public async fetchImageByAxios(
  //   messageId: string,
  //   path: string
  // ): Promise<void> {
  //   try {
  //     // LINE Messaging API から画像のURLを取得
  //     const contentURL = await this.client.getMessageContentUrl(messageId);

  //     // axios を使って画像データをバイナリ形式で取得
  //     const response = await axios.get(contentURL.url, {
  //       responseType: 'arraybuffer',
  //     });

  //     // 取得したデータをファイルに書き込み
  //     fs.writeFileSync(path, Buffer.from(response.data));
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
}
