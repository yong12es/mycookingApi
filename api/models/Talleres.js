const { Sequelize, DataTypes } = require('sequelize');

module.exports=(sequelize) => {
    const Talleres = sequelize.define('Talleres',{
        nombre :{
            type: DataTypes.STRING,
            allownull:false,
        },
        fecha:{
            type:DataTypes.DATE,
            allownull:false,
        },
        duracion:{
            type:DataTypes.INTEGER,
            allownull:false,
        },
        descripcion:{
            type:DataTypes.STRING,
            allownull:false,
        },

    },{timestamps :false});
    return Talleres;
}
