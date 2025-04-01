/// <reference types="mocha" />

import { expect } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcrypt';
import { User } from '../../src/models/user.model';
import authService from '../../src/services/auth.service';
import jwt from 'jsonwebtoken';
import { LoginCredentials, RegisterData, AuthTokens } from '../../src/services/auth.service';

describe('Auth Service', () => {
  let sandbox: sinon.SinonSandbox;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('register', () => {
    it('should hash password and create a new user', async () => {
      // 테스트를 위한 Stub 설정
      const hashStub = sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');
      const createStub = sandbox.stub(User, 'create').resolves({
        id: '123456',
        email: 'test@example.com',
        name: 'testuser',
        role: 'user',
        password: 'hashedPassword',
        validatePassword: () => Promise.resolve(true),
      } as unknown as User);

      // generateAccessToken와 generateRefreshToken 스텁 추가
      const generateTokensStub = sandbox.stub(jwt, 'sign').returns('mockedToken' as any);

      // 테스트 실행
      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'testuser',
      });

      // 검증
      expect(hashStub.calledOnce).to.be.true;
      expect(createStub.calledOnce).to.be.true;
      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');
      expect(result).to.have.property('expiresIn');
    });

    it('should throw an error if email already exists', async () => {
      // 이미 존재하는 이메일을 시뮬레이션
      sandbox.stub(User, 'findOne').resolves({
        id: '123456',
        email: 'existing@example.com',
      } as unknown as User);

      try {
        await authService.register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'existinguser',
        });
        // 에러가 발생해야 하므로 여기에 도달하면 안 됨
        expect.fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.message).to.include('이미 사용 중인 이메일입니다');
      }
    });
  });

  describe('login', () => {
    it('should return tokens if credentials are valid', async () => {
      // 테스트를 위한 Stub 설정
      const userStub = {
        id: '123456',
        email: 'test@example.com',
        name: 'testuser',
        role: 'user',
        password: 'hashedPassword',
        isActive: true,
        validatePassword: sinon.stub().resolves(true),
        update: sinon.stub().resolves(),
      } as unknown as User;
      
      sandbox.stub(User, 'findOne').resolves(userStub);
      // JWT sign 함수의 반환 타입 수정
      const jwtSignStub = sandbox.stub(jwt, 'sign');
      jwtSignStub.returns('mockedToken' as any);
      
      // 테스트 실행
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // 검증
      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');
      expect(result).to.have.property('expiresIn');
    });

    it('should throw an error if user not found', async () => {
      // 사용자를 찾을 수 없는 경우 시뮬레이션
      sandbox.stub(User, 'findOne').resolves(null);

      try {
        await authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        });
        // 에러가 발생해야 하므로 여기에 도달하면 안 됨
        expect.fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.message).to.include('이메일 또는 비밀번호가 올바르지 않습니다');
      }
    });

    it('should throw an error if password is invalid', async () => {
      // 잘못된 비밀번호 시뮬레이션
      const userStub = {
        id: '123456',
        email: 'test@example.com',
        password: 'hashedPassword',
        isActive: true,
        validatePassword: sinon.stub().resolves(false),
      } as unknown as User;
      
      sandbox.stub(User, 'findOne').resolves(userStub);

      try {
        await authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
        // 에러가 발생해야 하므로 여기에 도달하면 안 됨
        expect.fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.message).to.include('이메일 또는 비밀번호가 올바르지 않습니다');
      }
    });
  });
}); 