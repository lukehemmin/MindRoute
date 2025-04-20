import axios from 'axios';
import useAuthStore from '../utils/authStore';
import { AIModel } from '../types/provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// API 클라이언트 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 설정
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// AI 모델 API

/**
 * 모든 AI 모델 가져오기
 */
export const getAllModels = async () => {
  try {
    const response = await api.get('/api/admin/models');
    return response.data;
  } catch (error) {
    console.error('모델 목록 조회 오류:', error);
    return {
      success: false,
      message: '모델 목록을 가져오는데 실패했습니다.',
    };
  }
};

/**
 * 특정 제공업체의 모델 가져오기
 */
export const getModelsByProviderId = async (providerId: string) => {
  try {
    const response = await api.get(`/api/admin/providers/${providerId}/models`);
    return response.data;
  } catch (error) {
    console.error(`제공업체(${providerId})의 모델 목록 조회 오류:`, error);
    return {
      success: false,
      message: '모델 목록을 가져오는데 실패했습니다.',
    };
  }
};

/**
 * 특정 제공업체의 모델 새로고침 요청
 * API에서 최신 모델 목록을 가져와 DB에 저장
 */
export const refreshProviderModels = async (providerId: string) => {
  try {
    const response = await api.post(`/api/admin/providers/${providerId}/models/refresh`);
    return response.data;
  } catch (error) {
    console.error(`제공업체(${providerId})의 모델 새로고침 오류:`, error);
    return {
      success: false,
      message: '모델 목록을 새로고침하는데 실패했습니다.',
    };
  }
};

/**
 * 모든 활성화된 제공업체의 모델 새로고침 요청
 * 모든 활성화된 제공업체의 API에서 최신 모델 목록을 가져와 DB에 저장
 */
export const refreshAllProviderModels = async () => {
  try {
    const response = await api.post('/api/admin/models/refresh-all');
    return response.data;
  } catch (error) {
    console.error('모든 제공업체 모델 새로고침 오류:', error);
    return {
      success: false,
      message: '모델 목록을 새로고침하는데 실패했습니다.',
    };
  }
};

/**
 * 특정 모델 가져오기
 */
export const getModelById = async (modelId: string) => {
  try {
    const response = await api.get(`/api/admin/models/${modelId}`);
    return response.data;
  } catch (error) {
    console.error(`모델(${modelId}) 조회 오류:`, error);
    return {
      success: false,
      message: '모델 정보를 가져오는데 실패했습니다.',
    };
  }
};

/**
 * 모델 생성하기
 */
export const createModel = async (modelData: Partial<AIModel>) => {
  try {
    const response = await api.post('/api/admin/models', modelData);
    return response.data;
  } catch (error) {
    console.error('모델 생성 오류:', error);
    return {
      success: false,
      message: '모델을 생성하는데 실패했습니다.',
    };
  }
};

/**
 * 모델 업데이트하기
 */
export const updateModel = async (modelId: string, modelData: Partial<AIModel>) => {
  try {
    const response = await api.put(`/api/admin/models/${modelId}`, modelData);
    return response.data;
  } catch (error) {
    console.error(`모델(${modelId}) 업데이트 오류:`, error);
    return {
      success: false,
      message: '모델을 업데이트하는데 실패했습니다.',
    };
  }
};

/**
 * 모델 삭제하기
 */
export const deleteModel = async (modelId: string) => {
  try {
    const response = await api.delete(`/api/admin/models/${modelId}`);
    return response.data;
  } catch (error) {
    console.error(`모델(${modelId}) 삭제 오류:`, error);
    return {
      success: false,
      message: '모델을 삭제하는데 실패했습니다.',
    };
  }
};

export default api; 