import LineMessagingClient from './line-message-client';
import { WebhookEvent, middleware } from '@line/bot-sdk';
import express, { Application, Request, Response } from 'express';
import { load } from 'ts-dotenv';

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
  channelAccessToken: env.CHANNEL_ACCESS_TOKEN || '',
  channelSecret: env.CHANNEL_SECRET,
};

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
