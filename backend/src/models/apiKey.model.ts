import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ApiKeyAttributes {
  id: string;
  userId: number;
  name: string;
  key: string;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ApiKeyCreationAttributes extends Optional<ApiKeyAttributes, 'lastUsedAt'> {}

class ApiKey extends Model<ApiKeyAttributes, ApiKeyCreationAttributes> 
  implements ApiKeyAttributes {
  public id!: string;
  public userId!: number;
  public name!: string;
  public key!: string;
  public lastUsedAt!: Date;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ApiKey.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'api_keys',
    timestamps: true
  }
);

export { ApiKey }; 