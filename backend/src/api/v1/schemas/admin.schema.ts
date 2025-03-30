import Joi from 'joi';

export const createRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': '역할 이름은 최소 2자 이상이어야 합니다.',
    'string.max': '역할 이름은 최대 50자까지 가능합니다.',
    'string.empty': '역할 이름은 필수 항목입니다.',
    'any.required': '역할 이름은 필수 항목입니다.'
  }),
  permissions: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': '하나 이상의 권한이 필요합니다.',
    'any.required': '권한은 필수 항목입니다.'
  })
});

export const updateRoleSchema = Joi.object({
  permissions: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': '하나 이상의 권한이 필요합니다.',
    'any.required': '권한은 필수 항목입니다.'
  })
});

export const updateUserRoleSchema = Joi.object({
  roleId: Joi.number().integer().positive().required().messages({
    'number.base': '역할 ID는 숫자여야 합니다.',
    'number.integer': '역할 ID는 정수여야 합니다.',
    'number.positive': '역할 ID는 양수여야 합니다.',
    'any.required': '역할 ID는 필수 항목입니다.'
  })
});
