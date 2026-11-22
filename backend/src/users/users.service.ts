import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateProfileInput } from './dto/update-profile.input';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  create(data: Pick<User, 'email' | 'passwordHash' | 'firstName' | 'lastName'>) {
    return this.repo.save(this.repo.create(data));
  }

  async getById(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('Сессия истекла, войдите снова');
    return user;
  }

  async update(id: string, input: UpdateProfileInput) {
    const user = await this.getById(id);
    if (input.firstName?.trim()) user.firstName = input.firstName.trim();
    if (input.lastName?.trim()) user.lastName = input.lastName.trim();
    // Пустая строка в необязательных полях означает «убрать значение», а не сохранить пустоту.
    if (input.phone !== undefined) user.phone = input.phone.trim() || null;
    if (input.address !== undefined) user.address = input.address.trim() || null;
    return this.repo.save(user);
  }
}
