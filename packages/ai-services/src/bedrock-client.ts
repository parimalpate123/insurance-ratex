/**
 * AWS Bedrock Client for Claude Sonnet
 */
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

export interface BedrockConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  modelId?: string;
}

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockResponse {
  content: string;
  stopReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export class BedrockClient {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor(config: BedrockConfig) {
    const clientConfig: any = {
      region: config.region || 'us-east-1',
    };

    if (config.accessKeyId && config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      };
    }

    this.client = new BedrockRuntimeClient(clientConfig);
    this.modelId =
      config.modelId || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  }

  async invoke(
    messages: BedrockMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<BedrockResponse> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      ...(options?.systemPrompt && { system: options.systemPrompt }),
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    try {
      const response = await this.client.send(command);
      const responseBody = JSON.parse(
        new TextDecoder().decode(response.body)
      );

      return {
        content: responseBody.content[0].text,
        stopReason: responseBody.stop_reason,
        usage: {
          inputTokens: responseBody.usage.input_tokens,
          outputTokens: responseBody.usage.output_tokens,
        },
      };
    } catch (error: any) {
      console.error('Bedrock invocation error:', error);
      throw new Error(`Failed to invoke Bedrock: ${error.message}`);
    }
  }

  async complete(
    prompt: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    const response = await this.invoke(
      [{ role: 'user', content: prompt }],
      options
    );
    return response.content;
  }
}
