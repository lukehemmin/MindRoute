import Joi from 'joi';

export const completionSchema = Joi.object({
  provider: Joi.string().required().messages({
    'string.empty': '프로바이더는 필수 항목입니다.',
    'any.required': '프로바이더는 필수 항목입니다.'
  }),
  model: Joi.string().required().messages({
    'string.empty': '모델은 필수 항목입니다.',
    'any.required': '모델은 필수 항목입니다.'
  }),
  prompt: Joi.string().when('messages', {
    is: Joi.array().min(1),
    then: Joi.optional(),
    otherwise: Joi.required()
  }).messages({
    'string.empty': '프롬프트 또는 메시지는 필수 항목입니다.',
    'any.required': '프롬프트 또는 메시지는 필수 항목입니다.'
  }),
  messages: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant', 'system').required(),
      content: Joi.string().required()
    })
  ).when('prompt', {
    is: Joi.string().min(1),
    then: Joi.optional(),
    otherwise: Joi.required()
  }),
  systemPrompt: Joi.string().optional(),
  temperature: Joi.number().min(0).max(2).optional(),
  maxTokens: Joi.number().integer().min(1).max(4096).optional(),
  stream: Joi.boolean().optional(),
});

export const streamCompletionSchema = completionSchema.keys({
  stream: Joi.boolean().default(true)
});
