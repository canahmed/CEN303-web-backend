const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Schedule = sequelize.define('Schedule', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        section_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'course_sections', key: 'id' }
        },
        day_of_week: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 },
            comment: '1=Monday, 2=Tuesday, ... 5=Friday'
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        classroom_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'classrooms', key: 'id' }
        }
    }, {
        tableName: 'schedules',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['section_id'] },
            { fields: ['classroom_id', 'day_of_week', 'start_time'] }
        ]
    });

    return Schedule;
};
