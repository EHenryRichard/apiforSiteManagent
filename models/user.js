import { DataTypes } from 'sequelize';
import { getSequelizeSync } from '../config/database.js';
import bcrypt from 'bcrypt';
let User = null;

const getUserModel = () => {
  if (!User) {
    const sequelize = getSequelizeSync();
    User = sequelize.define(
      'user',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        fullname: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: false,
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
          validate: {
            len: [8, 255],
            notEmpty: true,
          },
        },
      },
      {
        timestamps: true, // Enable timestamps
        createdAt: true, // Keep createdAt
        updatedAt: false, // Disable updatedAt
      },
      {
        hooks: {
          beforeCreate: async (user) => {
            if (user.password) {
              user.password = await bcrypt.hash(
                user.password,
                12
              );
            }
          },
          beforeUpdate: async (user) => {
            if (user.changed('password')) {
              user.password = await bcrypt.hash(
                user.password,
                12
              );
            }
          },
        },
      }
    );
    User.prototype.verifyPassword = async function (
      password
    ) {
      return bcrypt.compare(password, this.password);
    };
  }
  return User;
};

export default getUserModel;
