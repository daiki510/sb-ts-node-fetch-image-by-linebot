import { Client } from '@line/bot-sdk';
import { load } from 'ts-dotenv';
import * as fs from 'fs';
import axios from 'axios';

const env = load({
  CHANNEL_ACCESS_TOKEN: String,
  CHANNEL_SECRET: String,
});

interface LineMessagingClientConfig {
  channelAccessToken: string;
  channelSecret: string;
}

export default class LineMessagingClient {
  private client: Client;

  constructor() {
    const config = {
      channelAccessToken: env.CHANNEL_ACCESS_TOKEN,
      channelSecret: env.CHANNEL_SECRET,
    };
    this.client = new Client(config);
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
          fs.writeFileSync('./data/sample.jpg', buffer);
          resolve();
        });

        stream.on('error', (err) => {
          reject(err);
        });
      });
    });
  }

  // public async fetchImageByAxios(messageId: string): Promise<void> {
  //   try {
  //     const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  //     const res = await axios.get(url, {
  //       responseType: 'arraybuffer',
  //       headers: { Authorization: `Bearer ${env.CHANNEL_ACCESS_TOKEN}` },
  //     });
  //     fs.writeFileSync('./data/sample.jpg', Buffer.from(res.data));
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
}
