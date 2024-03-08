const { Sequelize, DataTypes } = require('sequelize');

module.exports=(sequelize) => {
    const Pais = sequelize.define('Pais',{
        nombre :{
            type: DataTypes.STRING,
            allownull:false,
        },
        continente:{
            type:DataTypes.ENUM('asia','europa','africa'),
            allownull:false,
        },

    },{timestamps :false});
    return Pais;
}
