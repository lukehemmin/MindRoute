import Joi from 'joi';

export const registerProviderSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.empty': '프로바이더 이름은 필수 항목입니다.',
    'any.required': '프로바이더 이름은 필수 항목입니다.'
  }),
  displayName: Joi.string().allow('').optional(),
  apiKey: Joi.string().required().messages({
    'string.empty': 'API 키는 필수 항목입니다.',
    'any.required': 'API 키는 필수 항목입니다.'
  }),
  organization: Joi.string().allow('').optional(),
  baseUrl: Joi.string().uri().allow('').optional().messages({
    'string.uri': '올바른 URL 형식이 아닙니다.'
  }),
  models: Joi.array().items(Joi.string()).optional()
});

export const updateProviderSchema = Joi.object({
  apiKey: Joi.string().allow('').optional(),
  displayName: Joi.string().allow('').optional(),
  organization: Joi.string().allow('').optional(),
  baseUrl: Joi.string().uri().allow('').optional().messages({
    'string.uri': '올바른 URL 형식이 아닙니다.'
  }),
  models: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional()
}).min(1).messages({
  'object.min': '하나 이상의 필드를 포함해야 합니다.'
});
