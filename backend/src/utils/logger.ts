import winston from 'winston';
import path from 'path';

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 개발/프로덕션 모드에 따른 로그 레벨 선택
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// 로그 색상 설정
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// 로그 포맷 설정
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// 로그 저장 경로 설정
const logDir = 'logs';
const filename = path.join(logDir, 'app.log');

// 트랜스포트 설정 (콘솔 및 파일)
const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename }),
];

// 로거 생성
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger; 