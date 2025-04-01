import { Request, Response, NextFunction } from 'express';
import { RequestHandler } from 'express';
import fileUpload from 'express-fileupload';
import logger from '../utils/logger';

// 파일 업로드 구성
const fileUploadMiddleware = fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  abortOnLimit: true,
  useTempFiles: false,
  tempFileDir: '/tmp/',
  preserveExtension: true,
  debug: process.env.NODE_ENV === 'development',
});

// 파일 처리 미들웨어
export const handleFileUpload: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  // 파일이 없으면 다음 미들웨어로 이동
  if (!req.files && !req.file) {
    next();
    return;
  }
  
  try {
    let files = req.files || {};
    
    // 파일 개수 제한
    const fileCount = Array.isArray(files) 
      ? files.length 
      : Object.values(files).reduce((count, fileArr) => count + (Array.isArray(fileArr) ? fileArr.length : 1), 0);
    
    if (fileCount > 10) {
      res.status(400).json({
        success: false,
        error: 'Too many files. Maximum of 10 files allowed',
      });
      return;
    }
    
    // 각 파일 유효성 검사
    if (!Array.isArray(files)) {
      const fileArrays = Object.values(files);
      for (const fileArr of fileArrays) {
        if (Array.isArray(fileArr)) {
          for (const file of fileArr) {
            validateFile(file);
          }
        } else {
          validateFile(fileArr);
        }
      }
    } else {
      for (const file of files) {
        validateFile(file);
      }
    }
    
    next();
  } catch (error: any) {
    logger.error(`File upload error: ${error.message}`);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// 파일 유효성 검사 함수
const validateFile = (file: any) => {
  // 지원하는 MIME 타입 확인
  const allowedImageTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp', 
    'image/svg+xml'
  ];
  
  const allowedVideoTypes = [
    'video/mp4', 
    'video/mpeg', 
    'video/webm'
  ];
  
  const allowedDocumentTypes = [
    'application/pdf',
    'application/json',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' // pptx
  ];
  
  const allowedMimeTypes = [
    ...allowedImageTypes,
    ...allowedVideoTypes,
    ...allowedDocumentTypes
  ];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} is not supported`);
  }
  
  // 파일 크기 제한 확인 (더 큰 이미지/동영상 처리를 위해 유형별로 분리)
  const maxSizes = {
    image: 10 * 1024 * 1024, // 10MB for images
    video: 50 * 1024 * 1024, // 50MB for videos
    document: 25 * 1024 * 1024 // 25MB for documents
  };
  
  let maxSize = maxSizes.document; // 기본값
  
  if (allowedImageTypes.includes(file.mimetype)) {
    maxSize = maxSizes.image;
  } else if (allowedVideoTypes.includes(file.mimetype)) {
    maxSize = maxSizes.video;
  }
  
  if (file.size > maxSize) {
    const sizeInMB = maxSize / (1024 * 1024);
    throw new Error(`File too large. Maximum size is ${sizeInMB}MB for this file type`);
  }
};

export default fileUploadMiddleware; 