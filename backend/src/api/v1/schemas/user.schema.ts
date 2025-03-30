import Joi from 'joi';

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional().messages({
    'string.min': '이름은 최소 2자 이상이어야 합니다.',
    'string.max': '이름은 최대 50자까지 가능합니다.'
  }),
  email: Joi.string().email().optional().messages({
    'string.email': '유효한 이메일 형식이 아닙니다.'
  }),
  currentPassword: Joi.string().when('newPassword', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'any.required': '새 비밀번호를 설정하려면 현재 비밀번호가 필요합니다.'
  }),
  newPassword: Joi.string().min(8).optional().messages({
    'string.min': '비밀번호는 최소 8자 이상이어야 합니다.'
  })
}).min(1).messages({
  'object.min': '하나 이상의 필드를 포함해야 합니다.'
});

export const createApiKeySchema = Joi.object({
  name: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'API 키 이름은 필수 항목입니다.',
    'string.min': 'API 키 이름은 최소 1자 이상이어야 합니다.',
    'string.max': 'API 키 이름은 최대 50자까지 가능합니다.',
    'any.required': 'API 키 이름은 필수 항목입니다.'
  })
});

export const toggleApiKeySchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    'boolean.base': '활성화 상태는 true 또는 false 값이어야 합니다.',
    'any.required': '활성화 상태는 필수 항목입니다.'
  })
});
