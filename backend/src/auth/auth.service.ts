import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthPayload } from './auth-payload.model';
import { LoginInput, RegisterInput } from './dto/auth.inputs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthPayload> {
    const email = input.email.trim().toLowerCase();
    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException('Пользователь с таким email уже зарегистрирован');
    }
    const user = await this.usersService.create({
      email,
      passwordHash: await hash(input.password, 10),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
    });
    return this.sign(user);
  }

  async login(input: LoginInput): Promise<AuthPayload> {
    const user = await this.usersService.findByEmail(input.email);
    // Одинаковый ответ для неизвестного email и неверного пароля — не раскрываем, есть ли аккаунт.
    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return this.sign(user);
  }

  private sign(user: User): AuthPayload {
    return {
      accessToken: this.jwt.sign({ sub: user.id, email: user.email }),
      user,
    };
  }
}
