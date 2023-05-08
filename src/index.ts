import { Client } from '@line/bot-sdk';
import { load } from 'ts-dotenv';
import * as fs from 'fs';
import axios from 'axios';
import { WebhookEvent, middleware } from '@line/bot-sdk';
import express, { Application, Request, Response } from 'express';

const env = load({
  CHANNEL_ACCESS_TOKEN: String,
  CHANNEL_SECRET: String,
  BASE_URL: String,
  PORT: Number,
  USER_ID_LIST: String,
});
const BASE_URL = env.BASE_URL || 'http://localhost';
const PORT = env.PORT || 3000;
const USER_ID_LIST = env.USER_ID_LIST?.split(',') || [];

const lineMessagingClientConfig = {
  channelAccessToken: env.CHANNEL_ACCESS_TOKEN,
  channelSecret: env.CHANNEL_SECRET,
};

class LineMessagingClient {
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

  public async fetchImageByAxios(messageId: string): Promise<void> {
    try {
      const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { Authorization: `Bearer ${env.CHANNEL_ACCESS_TOKEN}` },
      });
      fs.writeFileSync('./data/sample.jpg', Buffer.from(res.data));
    } catch (err) {
      console.error(err);
    }
  }
}

const lineMessagingClient = new LineMessagingClient();

const app: Application = express();

app.get('/webhook', async (_: Request, res: Response): Promise<Response> => {
  return res.status(200).send('Health OK');
});

app.post(
  '/webhook',
  middleware(lineMessagingClientConfig),
  async (req: Request, res: Response): Promise<Response> => {
    const events: WebhookEvent[] = req.body.events;
    await Promise.all(
      events.map(async (event: WebhookEvent) => {
        const userId = event.source.userId;
        if (!userId || !USER_ID_LIST.includes(userId))
          throw new Error('不正なユーザーのためブロック');
        if (event.type !== 'message' || event.message.type !== 'image') return;
        await lineMessagingClient.fetchImageByStream(event.message.id);
      })
    );
    return res.status(200);
  }
);

app.listen(PORT, () => {
  console.log(`${BASE_URL}:${PORT}/`);
});
