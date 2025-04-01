/// <reference types="mocha" />

import sinon from 'sinon';
import bcrypt from 'bcrypt';
import { User } from '../../src/models/user.model';
import jwt from 'jsonwebtoken';
import * as jwtUtils from '../../src/utils/jwt';
import authService, { LoginCredentials, RegisterData, AuthTokens } from '../../src/services/auth.service';

// chai를 전역 변수로 선언하여 동적으로 로드
declare const require: any;
const chai = require('chai');
const { expect } = chai;

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
      // 먼저 findOne 스텁을 설정하여 null 반환 (사용자가 존재하지 않음)
      sandbox.stub(User, 'findOne').resolves(null);
      
      // 비밀번호 해싱 모킹
      const hashStub = sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');
      
      // 새 사용자 생성 모킹
      const userStub = {
        id: '123456',
        email: 'test@example.com',
        name: 'testuser',
        role: 'user',
        password: 'hashedPassword',
        validatePassword: () => Promise.resolve(true),
      } as unknown as User;
      const createStub = sandbox.stub(User, 'create').resolves(userStub);

      // JWT 함수 모킹
      sandbox.stub(jwtUtils, 'generateAccessToken').returns('mock-access-token');
      sandbox.stub(jwtUtils, 'generateRefreshToken').resolves('mock-refresh-token');

      // 테스트 실행
      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'testuser',
      } as RegisterData);

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
        } as RegisterData);
        // 에러가 발생해야 하므로 여기에 도달하면 안 됨
        expect.fail('Expected an error to be thrown');
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).to.include('이미 사용 중인 이메일입니다');
        }
      }
    });
  });

  describe('login', () => {
    it('should return tokens if credentials are valid', async () => {
      // generateRefreshToken 모킹
      sandbox.stub(jwtUtils, 'generateRefreshToken').resolves('mock-refresh-token');
      sandbox.stub(jwtUtils, 'generateAccessToken').returns('mock-access-token');
      
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
      
      // 테스트 실행
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      } as LoginCredentials);

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
        } as LoginCredentials);
        // 에러가 발생해야 하므로 여기에 도달하면 안 됨
        expect.fail('Expected an error to be thrown');
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).to.include('이메일 또는 비밀번호가 올바르지 않습니다');
        }
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
        } as LoginCredentials);
        // 에러가 발생해야 하므로 여기에 도달하면 안 됨
        expect.fail('Expected an error to be thrown');
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).to.include('이메일 또는 비밀번호가 올바르지 않습니다');
        }
      }
    });
  });
}); 