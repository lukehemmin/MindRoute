import { User } from './user.model';
import { Provider } from './provider.model';
import UserProvider from './userProvider.model';
import { Log } from './log.model';
import Ticket from './ticket.model';
import sequelize from '../config/database';
import RefreshToken from './refreshtoken.model';

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

// Ticket과 User 관계 설정
Ticket.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(Ticket, {
  foreignKey: 'userId',
  as: 'tickets',
});

// 관계 설정 (필요시)
User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Log, { foreignKey: 'userId', as: 'logs' });

Provider.hasMany(Log, { foreignKey: 'providerId', as: 'logs' });

export {
  User,
  Provider,
  UserProvider,
  Log,
  Ticket,
  sequelize,
  RefreshToken,
}; 