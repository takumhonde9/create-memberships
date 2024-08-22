import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SQSClient, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { QueueConfig } from '../../config';

@Injectable()
export class SQSService {
  client: SQSClient;
  constructor(
    @Inject(QueueConfig.KEY)
    private readonly config: ConfigType<typeof QueueConfig>,
  ) {
    this.client = new SQSClient({
      region: config.Region,
      credentials: {
        accessKeyId: config.AccessKeyId,
        secretAccessKey: config.SecretAccessKey,
      },
    });
  }

  /**
   * Delete message from queue.
   *
   * @param receiptHandle the message receipt handle as provided by the SQS event record.
   */
  async deleteMessage(receiptHandle: any): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: this.config.QueueUrl,
      ReceiptHandle: receiptHandle,
    });

    await this.client.send(command).catch((e) => {
      console.error(e);
    });
    return;
  }
}
