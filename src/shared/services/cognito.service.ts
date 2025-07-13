import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';

@Injectable()
export class CognitoService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;

  constructor(private configService: ConfigService) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get<string>('cognito.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId'),
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey'),
      },
    });
    this.userPoolId = this.configService.get<string>('cognito.userPoolId');
  }

  async createUser(
    username: string,
    email: string,
    temporaryPassword: string,
  ): Promise<any> {
    const command = new AdminCreateUserCommand({
      UserPoolId: this.userPoolId,
      Username: username,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
      ],
      TemporaryPassword: temporaryPassword,
      MessageAction: 'SUPPRESS',
    });

    return await this.cognitoClient.send(command);
  }

  async setUserPassword(
    username: string,
    password: string,
    permanent: boolean = true,
  ): Promise<any> {
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: this.userPoolId,
      Username: username,
      Password: password,
      Permanent: permanent,
    });

    return await this.cognitoClient.send(command);
  }

  async getUser(username: string): Promise<any> {
    const command = new AdminGetUserCommand({
      UserPoolId: this.userPoolId,
      Username: username,
    });

    return await this.cognitoClient.send(command);
  }

  async updateUserAttributes(
    username: string,
    attributes: { Name: string; Value: string }[],
  ): Promise<any> {
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: this.userPoolId,
      Username: username,
      UserAttributes: attributes,
    });

    return await this.cognitoClient.send(command);
  }

  async deleteUser(username: string): Promise<any> {
    const command = new AdminDeleteUserCommand({
      UserPoolId: this.userPoolId,
      Username: username,
    });

    return await this.cognitoClient.send(command);
  }

  async listUsers(limit: number = 10, paginationToken?: string): Promise<any> {
    const command = new ListUsersCommand({
      UserPoolId: this.userPoolId,
      Limit: limit,
      PaginationToken: paginationToken,
    });

    return await this.cognitoClient.send(command);
  }
}
