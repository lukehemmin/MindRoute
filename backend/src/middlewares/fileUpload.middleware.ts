import { Request, Response, NextFunction } from 'express';
import { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from './error.middleware';
import logger from '../utils/logger';

// 허용된 파일 형식
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// 업로드 디렉토리
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// 업로드 디렉토리 생성
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const handleFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      // 파일이 없어도 계속 진행
      return next();
    }
    
    const uploadedFiles: any[] = [];
    
    // 단일 파일 또는 다중 파일 처리
    const files = req.files.files ? 
      (Array.isArray(req.files.files) ? req.files.files : [req.files.files]) : 
      [];
    
    // 각 파일 검증 및 처리
    for (const file of files) {
      // 파일 확장자 검증
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw ApiError.badRequest(`지원하지 않는 파일 형식입니다: ${ext}. 허용된 형식: ${ALLOWED_EXTENSIONS.join(', ')}`);
      }
      
      // 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        throw ApiError.badRequest(`파일 크기가 너무 큽니다. 최대 허용 크기: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }
      
      // 고유한 파일명 생성
      const filename = `${uuidv4()}${ext}`;
      const uploadPath = path.join(UPLOAD_DIR, filename);
      
      // 파일 저장
      file.mv(uploadPath, (err: Error) => {
        if (err) {
          logger.error(`파일 업로드 오류: ${err.message}`);
          throw ApiError.internal('파일 업로드 중 오류가 발생했습니다.');
        }
      });
      
      // 업로드된 파일 정보 저장
      uploadedFiles.push({
        originalName: file.name,
        filename: filename,
        path: uploadPath,
        size: file.size,
        mimetype: file.mimetype,
      });
    }
    
    // 업로드된 파일 정보를 요청 객체에 추가
    req.uploadedFiles = uploadedFiles;
    next();
  } catch (error) {
    next(error);
  }
}; 