import { Injectable } from '@nestjs/common';
import { greetWorkflow } from './workflows/greet.workflow';

@Injectable()
export class MastraService {
  async greet(name: string): Promise<string> {
    const result = await (greetWorkflow as any).execute({ name });
    return (result as any).output.reply;
  }
}
