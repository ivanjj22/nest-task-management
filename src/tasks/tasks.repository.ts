import { InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';
import { Brackets, EntityRepository, Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  private logger = new Logger();
  async createTask(createTaskDto: CreateTaskDto, user): Promise<Task> {
    const { title, description } = createTaskDto;
    const task = this.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user,
    });
    await this.save(task);
    return task;
  }

  async getTasks(
    getTaskFilterDto: GetTaskFilterDto,
    user: User,
  ): Promise<Task[]> {
    const query = this.createQueryBuilder('task');
    query.where({ user });
    const { status, search } = getTaskFilterDto;
    if (status) {
      query.andWhere('task.status = :status', {
        status,
      });
    }

    if (search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('task.title ilike :title', {
            title: `%${search}%`,
          }).orWhere('task.description ilike :description', {
            description: `%${search}%`,
          });
        }),
      );
    }

    try {
      const tasks = await query.getMany();
      return tasks;
    } catch (error) {
      this.logger.error(
        `Error trying to retrieve tasks from database, DTO: ${JSON.stringify(
          getTaskFilterDto,
        )}, User: ${user.username}.`,
        error.stack,
      );
      throw new InternalServerErrorException();
    }
  }
}
