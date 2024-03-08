const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Ingredientes = sequelize.define('Ingredientes', {
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },{timestamps :false});
    return Ingredientes;
};
