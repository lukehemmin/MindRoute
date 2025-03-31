import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';
import Provider from './provider.model';

// 사용자-제공업체 속성 인터페이스
export interface UserProviderAttributes {
  id: string;
  userId: string;
  providerId: string;
  allowed: boolean;
  maxTokensOverride: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// 사용자-제공업체 생성 시 선택적 속성
export interface UserProviderCreationAttributes extends Optional<UserProviderAttributes, 'id' | 'createdAt' | 'updatedAt' | 'allowed' | 'maxTokensOverride'> {}

// 사용자-제공업체 모델 클래스
class UserProvider extends Model<UserProviderAttributes, UserProviderCreationAttributes> implements UserProviderAttributes {
  public id!: string;
  public userId!: string;
  public providerId!: string;
  public allowed!: boolean;
  public maxTokensOverride!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserProvider.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'providers',
        key: 'id',
      },
    },
    allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    maxTokensOverride: {
      type: DataTypes.INTEGER,
      allowNull: true, // null은 제한 없음을 의미
    },
  },
  {
    sequelize,
    modelName: 'UserProvider',
    tableName: 'user_providers',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'providerId'],
      },
    ],
  }
);

// 관계 설정
User.belongsToMany(Provider, {
  through: UserProvider,
  foreignKey: 'userId',
  otherKey: 'providerId',
});

Provider.belongsToMany(User, {
  through: UserProvider,
  foreignKey: 'providerId',
  otherKey: 'userId',
});

export default UserProvider; 