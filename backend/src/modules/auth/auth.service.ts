import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { User, UserRole, AcademicStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

export interface JwtPayloadData {
  sub: string;
  email: string;
  role: UserRole;
  firstName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'passwordHash'>;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async registerLocal(dto: RegisterDto): Promise<Omit<User, 'passwordHash'>> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create user and student profile in a single transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: UserRole.STUDENT, // Default role for local registration
          emailVerified: false,
          isActive: true,
        },
      });

      await tx.studentProfile.create({
        data: {
          userId: createdUser.id,
          studentCode: dto.studentCode,
          program: dto.program,
          faculty: dto.faculty ?? 'Por definir',
          semester: dto.semester ?? 1,
          academicStatus: AcademicStatus.ACTIVE,
          hasCompletedSubjects: true,
        },
      });

      return createdUser;
    });

    // TODO: Send verification email here
    // await this.emailService.sendVerificationEmail(user.email, verificationToken);

    // Return user without password
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async validateLocalUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    if (!user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: User): Promise<LoginResponse> {
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const tokens = this.generateTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days for refresh token

    // Create session record
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        isActive: true,
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userWithoutPassword,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Find session with this refresh token
    const session = await this.prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || !session.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Verify refresh token JWT
    try {
      this.jwtService.verify(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token signature');
    }

    const user = session.user;

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Update session with new tokens
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  async logout(userId: string, token: string): Promise<void> {
    // Deactivate session
    const session = await this.prisma.session.findFirst({
      where: {
        userId,
        token,
      },
    });

    if (session) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isActive: false },
      });
    }
  }

  async validateGoogleUser(profile: {
    id: string;
    displayName: string;
    name?: {
      givenName?: string;
      familyName?: string;
    };
    emails?: Array<{ value: string }>;
  }): Promise<User> {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new BadRequestException('Google profile does not contain email');
    }

    // Try to find user by googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (user) {
      return user;
    }

    // Try to find user by email and link if exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Link Google ID to existing account
      user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { googleId },
      });
      return user;
    }

    // Create new user from Google profile
    const firstName = profile.name?.givenName || profile.displayName || 'User';
    const lastName = profile.name?.familyName || '';

    user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          googleId,
          firstName,
          lastName,
          role: UserRole.STUDENT,
          emailVerified: true,
          isActive: true,
        },
      });

      const baseCode = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      await tx.studentProfile.create({
        data: {
          userId: createdUser.id,
          studentCode: `${baseCode}-${createdUser.id.substring(0, 6).toUpperCase()}`,
          program: 'Por definir',
          faculty: 'Por definir',
          semester: 1,
          academicStatus: AcademicStatus.ACTIVE,
          hasCompletedSubjects: true,
        },
      });

      return createdUser;
    });

    return user;
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      await this.prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      });
    } catch (error) {
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  private generateTokens(user: User): AuthTokens {
    const payload: JwtPayloadData = {
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('app.jwtExpiration') || '24h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}
