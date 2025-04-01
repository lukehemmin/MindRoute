const auth = {
  jwt: {
    // 액세스 토큰 설정
    accessTokenSecret: process.env.JWT_SECRET || 'your-access-secret-key-change-in-prod',
    accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m', // 15분
    
    // 리프레시 토큰 설정
    refreshTokenSecret: process.env.JWT_SECRET || 'your-refresh-secret-key-change-in-prod',
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d', // 7일
  },
  
  // 비밀번호 설정
  password: {
    saltRounds: 10, // bcrypt salt rounds
    minLength: 8,   // 최소 길이
  },
  
  // 초기 관리자 계정 설정
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@mindroute.com',
    password: process.env.ADMIN_PASSWORD || 'changeme123',
    name: process.env.ADMIN_NAME || 'Admin',
  },
};

export default auth; 