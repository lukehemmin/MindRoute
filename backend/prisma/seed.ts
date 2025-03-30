import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CryptoService } from '../src/services/CryptoService';

const prisma = new PrismaClient();
const cryptoService = new CryptoService();

async function main() {
  console.log('DB 시드 시작...');

  // 기본 역할 생성
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: '관리자 역할',
      permissions: ['admin', 'user', 'read', 'write', 'delete']
    }
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: '일반 사용자 역할',
      permissions: ['user', 'read', 'write']
    }
  });

  console.log('역할 생성 완료:', { adminRole, userRole });

  // 기본 관리자 사용자 생성
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: '관리자',
      password: adminPassword,
      roleId: adminRole.id,
      isActive: true
    }
  });

  // 기본 일반 사용자 생성
  const userPassword = await bcrypt.hash('user123', 10);
  const normalUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: '사용자',
      password: userPassword,
      roleId: userRole.id,
      isActive: true
    }
  });

  console.log('사용자 생성 완료:', { adminUser, normalUser });

  // 기본 프로바이더 생성
  const openAIProvider = await prisma.provider.upsert({
    where: { name: 'openai' },
    update: {},
    create: {
      name: 'openai',
      displayName: 'OpenAI',
      apiKey: await cryptoService.encrypt(process.env.OPENAI_API_KEY || ''),
      isActive: true,
      modelOptions: {}
    }
  });

  const anthropicProvider = await prisma.provider.upsert({
    where: { name: 'anthropic' },
    update: {},
    create: {
      name: 'anthropic',
      displayName: 'Anthropic Claude',
      apiKey: await cryptoService.encrypt(process.env.ANTHROPIC_API_KEY || ''),
      isActive: true,
      modelOptions: {}
    }
  });

  const googleProvider = await prisma.provider.upsert({
    where: { name: 'google' },
    update: {},
    create: {
      name: 'google',
      displayName: 'Google Gemini',
      apiKey: await cryptoService.encrypt(process.env.GOOGLE_API_KEY || ''),
      isActive: true,
      modelOptions: {}
    }
  });

  console.log('프로바이더 생성 완료:', { openAIProvider, anthropicProvider, googleProvider });

  console.log('DB 시드 완료');
}

main()
  .catch(e => {
    console.error('시드 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
