import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { ApiError } from './providers/baseProvider';

const prisma = new PrismaClient();

interface RegisterUserParams {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface LoginUserParams {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * 새 사용자 등록
   */
  async register({ email, password, name, role = UserRole.USER }: RegisterUserParams): Promise<User> {
    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError('이미 사용 중인 이메일입니다.', 409);
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    return user;
  }

  /**
   * 사용자 로그인
   */
  async login({ email, password }: LoginUserParams): Promise<{ token: string; user: Omit<User, 'password'> }> {
    // 이메일로 사용자 찾기
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new ApiError('유효하지 않은 이메일 또는 비밀번호입니다.', 401);
    }

    // 비밀번호 확인
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new ApiError('유효하지 않은 이메일 또는 비밀번호입니다.', 401);
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = user;
    return {
      token,
      user: userWithoutPassword,
    };
  }

  /**
   * 사용자 정보 변경
   */
  async updateUser(userId: string, data: { name?: string; password?: string }): Promise<User> {
    let updateData: any = { ...data };
    
    // 비밀번호를 변경하는 경우 해싱
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return user;
  }

  /**
   * 사용자 삭제
   */
  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }
}

export default new AuthService();
