import { IsEnum, isEnum } from 'class-validator';
import { TaskStatus } from '../task-status.enum';

export class UpdateTaskDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
