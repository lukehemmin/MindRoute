import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// 티켓 상태 열거형
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed',
}

// 티켓 속성 인터페이스
export interface TicketAttributes {
  id: string;
  userId: string;
  subject: string;
  message: string;
  adminResponse?: string;
  status: TicketStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// 티켓 생성 시 선택적 속성
export interface TicketCreationAttributes extends Optional<TicketAttributes, 'id' | 'createdAt' | 'updatedAt' | 'adminResponse' | 'status'> {}

// 티켓 모델 클래스
class Ticket extends Model<TicketAttributes, TicketCreationAttributes> implements TicketAttributes {
  public id!: string;
  public userId!: string;
  public subject!: string;
  public message!: string;
  public adminResponse!: string | undefined;
  public status!: TicketStatus;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Ticket.init(
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
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    adminResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(TicketStatus)),
      defaultValue: TicketStatus.OPEN,
    },
  },
  {
    sequelize,
    modelName: 'Ticket',
    tableName: 'tickets',
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default Ticket; 