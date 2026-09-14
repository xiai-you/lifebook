import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

export interface AuthResult {
  accessToken: string;
  user: Omit<User, "passwordHash" | "oauthId" | "email" | "oauthProvider">;
}

/** 认证服务：注册 / 登录 / 签发 JWT。OAuth（微信 / Apple）策略在此扩展。 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, ...(dto.email ? [{ email: dto.email }] : [])] },
    });
    if (exists) throw new ConflictException("用户名或邮箱已被注册");

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        nickname: dto.nickname,
        email: dto.email,
        passwordHash,
      },
    });
    return this.sign(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.account }, { email: dto.account }] },
    });
    if (!user?.passwordHash) throw new UnauthorizedException("账号或密码错误");

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("账号或密码错误");

    return this.sign(user);
  }

  /** 当前用户信息（脱敏 + 统计：作品 / 粉丝 / 关注 / 获赞 / 阅读）。 */
  async getMe(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { works: true, followers: true, following: true, likes: true } },
      },
    });
    if (!user) throw new UnauthorizedException("登录状态已失效");

    const agg = await this.prisma.work.aggregate({
      where: { authorId: id },
      _sum: { likeCount: true, viewCount: true },
    });

    const { passwordHash, oauthId, email, oauthProvider, _count, ...safe } = user;
    return {
      ...safe,
      stats: {
        works: _count.works,
        followers: _count.followers,
        following: _count.following,
        likes: agg._sum?.likeCount ?? 0,
        reads: agg._sum?.viewCount ?? 0,
      },
    };
  }

  private sign(user: User): AuthResult {
    const accessToken = this.jwt.sign({ sub: user.id });
    const { passwordHash: _omit, oauthId: _oid, email: _email, oauthProvider: _provider, ...safe } = user;
    return { accessToken, user: safe };
  }
}
