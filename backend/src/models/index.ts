import { User } from './user.model';
import { Provider } from './provider.model';
import UserProvider from './userProvider.model';
import { Log } from './log.model';
import Ticket from './ticket.model';
import sequelize from '../config/database';
import RefreshToken from './refreshtoken.model';
import { AiModel } from './aiModel.model';
import { ApiLog } from './apiLog.model';
import SystemConfig from './systemConfig.model';

// 모델 간의 관계를 설정하기 위해 UserProvider 모델을 가져옴
// (이미 userProvider.model.ts에서 관계가 설정되어 있음)

// Log와 User, Provider 관계 설정
Log.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Log.belongsTo(Provider, {
  foreignKey: 'providerId',
  as: 'provider',
});

// User 관계 설정
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
User.hasMany(Ticket, { foreignKey: 'userId', as: 'tickets' });
User.hasMany(Log, { foreignKey: 'userId', as: 'logs' });
User.hasMany(ApiLog, { foreignKey: 'userId', as: 'apiLogs' });

Provider.hasMany(Log, { foreignKey: 'providerId', as: 'logs' });

// Ticket 관계 설정
Ticket.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Provider 관계 설정
Provider.belongsToMany(User, {
  through: UserProvider,
  foreignKey: 'providerId',
  otherKey: 'userId',
});

User.belongsToMany(Provider, {
  through: UserProvider,
  foreignKey: 'userId',
  otherKey: 'providerId',
});

// AiModel과 Provider 관계 설정
AiModel.belongsTo(Provider, {
  foreignKey: 'providerId',
  as: 'provider'
});

Provider.hasMany(AiModel, {
  foreignKey: 'providerId',
  as: 'models'
});

export {
  User,
  Provider,
  UserProvider,
  Log,
  Ticket,
  RefreshToken,
  AiModel,
  ApiLog,
  SystemConfig,
  sequelize
}; 