import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get<string>('S3_ENDPOINT');
    this.bucket = config.get<string>('S3_BUCKET', 'insurratex-kb');

    this.client = new S3Client({
      region: config.get<string>('S3_REGION', 'us-east-1'),
      endpoint,
      credentials: {
        accessKeyId: config.get<string>('S3_ACCESS_KEY', 'insurratex'),
        secretAccessKey: config.get<string>('S3_SECRET_KEY', 'dev_password_change_in_prod'),
      },
      // Required for MinIO compatibility
      forcePathStyle: !!endpoint,
    });
  }

  async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created S3 bucket: ${this.bucket}`);
      } catch (err: any) {
        // Bucket may already exist - ignore BucketAlreadyOwnedByYou
        if (err.name !== 'BucketAlreadyOwnedByYou') {
          this.logger.warn(`Could not create bucket: ${err.message}`);
        }
      }
    }
  }

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<{ bucket: string; key: string }> {
    await this.ensureBucket();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    this.logger.log(`Uploaded to S3: ${this.bucket}/${key}`);
    return { bucket: this.bucket, key };
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    this.logger.log(`Deleted from S3: ${this.bucket}/${key}`);
  }

  getBucket(): string {
    return this.bucket;
  }
}
