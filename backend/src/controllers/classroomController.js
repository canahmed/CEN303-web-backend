const { Classroom } = require('../models');

const getClassrooms = async (req, res, next) => {
    try {
        const classrooms = await Classroom.findAll({
            order: [['building', 'ASC'], ['room_number', 'ASC']]
        });

        res.json({
            success: true,
            data: classrooms
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getClassrooms
};
