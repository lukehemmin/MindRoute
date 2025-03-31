import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

// 유효성 검사 결과 처리 미들웨어
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 사용자 등록 유효성 검사
export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 최소 8자 이상이어야 합니다.')
    .matches(/\d/)
    .withMessage('비밀번호는 적어도 하나의 숫자를 포함해야 합니다.'),
  body('firstName')
    .optional()
    .isString()
    .withMessage('유효한 이름을 입력해주세요.'),
  body('lastName')
    .optional()
    .isString()
    .withMessage('유효한 성을 입력해주세요.'),
  handleValidationErrors,
];

// 로그인 유효성 검사
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요.'),
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.'),
  handleValidationErrors,
];

// 토큰 갱신 유효성 검사
export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('리프레시 토큰이 필요합니다.'),
  handleValidationErrors,
]; 