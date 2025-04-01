import { expect } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcrypt';
import { User } from '../../src/models/user.model';
import authService from '../../src/services/auth.service';
import jwt from 'jsonwebtoken';

describe('Auth Service', () => {
  let sandbox: sinon.SinonSandbox;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('registerUser', () => {
    it('should hash password and create a new user', async () => {
      // 테스트를 위한 Stub 설정
      const hashStub = sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');
      const createStub = sandbox.stub(User, 'create').resolves({
        id: '123456',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        passwordHash: 'hashedPassword',
      } as unknown as User);

      // 테스트 실행
      const result = await authService.registerUser({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      });

      // 검증
      expect(hashStub.calledOnce).to.be.true;
      expect(createStub.calledOnce).to.be.true;
      expect(result).to.have.property('id', '123456');
      expect(result).to.have.property('email', 'test@example.com');
      expect(result).to.have.property('username', 'testuser');
      expect(result).to.have.property('role', 'user');
    });

    it('should throw an error if email already exists', async () => {
      // 이미 존재하는 이메일을 시뮬레이션
      sandbox.stub(User, 'findOne').resolves({
        id: '123456',
        email: 'existing@example.com',
      } as unknown as User);

      try {
        await authService.registerUser({
          email: 'existing@example.com',
          password: 'password123',
          username: 'existinguser',
        });
        // 에러가 발생해야 하므로 여기에 도달하면 안 됨
        expect.fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.message).to.include('이미 사용 중인 이메일입니다');
      }
    });
  });

  describe('loginUser', () => {
    it('should return user and token if credentials are valid', async () => {
      // 테스트를 위한 Stub 설정
      sandbox.stub(User, 'findOne').resolves({
        id: '123456',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        passwordHash: 'hashedPassword',
        isActive: true,
      } as unknown as User);
      
      sandbox.stub(bcrypt, 'compare').resolves(true);
      sandbox.stub(jwt, 'sign').returns('mockedToken');
      
      // 테스트 실행
      const result = await authService.loginUser({
        email: 'test@example.com',
        password: 'password123',
      });

      // 검증
      expect(result).to.have.property('user');
      expect(result.user).to.have.property('id', '123456');
      expect(result).to.have.property('token');
      expect(result).to.have.property('refreshToken');
    });

    it('should throw an error if user not found', async () => {
      // 사용자를 찾을 수 없는 경우 시뮬레이션
      sandbox.stub(User, 'findOne').resolves(null);

      try {
        await authService.loginUser({
          email: 'nonexistent@example.com',
          password: 'password123',
        });
        // 에러가 발생해야 하므로 여기에 도달하면 안 됨
        expect.fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.message).to.include('사용자를 찾을 수 없습니다');
      }
    });

    it('should throw an error if password is invalid', async () => {
      // 잘못된 비밀번호 시뮬레이션
      sandbox.stub(User, 'findOne').resolves({
        id: '123456',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        isActive: true,
      } as unknown as User);
      
      sandbox.stub(bcrypt, 'compare').resolves(false);

      try {
        await authService.loginUser({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
        // 에러가 발생해야 하므로 여기에 도달하면 안 됨
        expect.fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.message).to.include('잘못된 비밀번호입니다');
      }
    });
  });
}); 