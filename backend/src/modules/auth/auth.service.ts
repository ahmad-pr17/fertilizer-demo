import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    // Username is scoped globally here (not per-distributor) because a dealer
    // dashboard operator logs in without knowing a distributor id up front;
    // uniqueness is enforced per-distributor at the schema level, so this
    // assumes one operator account maps to exactly one distributor, which
    // holds for the single-pilot-client MVP.
    const user = await this.users.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      distributorId: user.distributorId,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        distributorId: user.distributorId,
      },
    };
  }
}
