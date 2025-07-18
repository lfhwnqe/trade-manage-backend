import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class DynamodbService {
  constructor(
    @Inject('DYNAMODB_CLIENT')
    private readonly dynamoClient: DynamoDBDocumentClient,
    private readonly configService: ConfigService,
  ) {}

  private getTableName(tableName: string): string {
    const prefix = this.configService.get<string>('dynamodb.tablePrefix');
    return `${prefix}-${tableName}`;
  }

  async put(tableName: string, item: any): Promise<any> {
    const command = new PutCommand({
      TableName: this.getTableName(tableName),
      Item: item,
    });
    return await this.dynamoClient.send(command);
  }

  async get(tableName: string, key: any): Promise<any> {
    const command = new GetCommand({
      TableName: this.getTableName(tableName),
      Key: key,
    });
    const result = await this.dynamoClient.send(command);
    return result.Item;
  }

  async update(
    tableName: string,
    key: any,
    updateExpression: string,
    expressionAttributeValues: any,
    expressionAttributeNames?: any,
  ): Promise<any> {
    const command = new UpdateCommand({
      TableName: this.getTableName(tableName),
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: 'ALL_NEW',
    });
    const result = await this.dynamoClient.send(command);
    return result.Attributes;
  }

  async delete(tableName: string, key: any): Promise<any> {
    const command = new DeleteCommand({
      TableName: this.getTableName(tableName),
      Key: key,
    });
    return await this.dynamoClient.send(command);
  }

  async scan(
    tableName: string,
    filterExpression?: string,
    expressionAttributeValues?: any,
  ): Promise<any[]> {
    const command = new ScanCommand({
      TableName: this.getTableName(tableName),
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });
    const result = await this.dynamoClient.send(command);
    return result.Items || [];
  }

  async query(
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: any,
    indexName?: string,
  ): Promise<any[]> {
    const command = new QueryCommand({
      TableName: this.getTableName(tableName),
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      IndexName: indexName,
    });
    const result = await this.dynamoClient.send(command);
    return result.Items || [];
  }

  async queryAll(
    tableName: string,
    keyConditionExpression: string,
    expressionAttributeValues: any,
    indexName?: string,
    projectionExpression?: string,
    expressionAttributeNames?: Record<string, string>,
  ): Promise<any[]> {
    let lastEvaluatedKey: Record<string, any> | undefined;
    const items: any[] = [];
    do {
      const command = new QueryCommand({
        TableName: this.getTableName(tableName),
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        IndexName: indexName,
        ProjectionExpression: projectionExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExclusiveStartKey: lastEvaluatedKey,
      });
      const result = await this.dynamoClient.send(command);
      if (result.Items) items.push(...result.Items);
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    return items;
  }

  async scanAll(
    tableName: string,
    filterExpression?: string,
    expressionAttributeValues?: any,
    projectionExpression?: string,
    expressionAttributeNames?: Record<string, string>,
  ): Promise<any[]> {
    let lastEvaluatedKey: Record<string, any> | undefined;
    const items: any[] = [];
    do {
      const command = new ScanCommand({
        TableName: this.getTableName(tableName),
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ProjectionExpression: projectionExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExclusiveStartKey: lastEvaluatedKey,
      });
      const result = await this.dynamoClient.send(command);
      if (result.Items) items.push(...result.Items);
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    return items;
  }

  async count(
    tableName: string,
    filterExpression?: string,
    expressionAttributeValues?: any,
  ): Promise<number> {
    const command = new ScanCommand({
      TableName: this.getTableName(tableName),
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Select: 'COUNT',
    });
    const result = await this.dynamoClient.send(command);
    return result.Count || 0;
  }
}
