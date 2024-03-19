const { Sequelize, DataTypes } = require('sequelize');

module.exports=(sequelize) => {
    const Receta = sequelize.define('Receta',{
        nombre :{
            type: DataTypes.STRING,
            allownull:false,
        },
        descripcion:{
            type:DataTypes.STRING,
            allownull:false,
        },
        instrucciones:{
            type:DataTypes.STRING,
            allownull:false,
        },
        imagen:{
            type:DataTypes.STRING,
            allownull:false,
        },

    },{timestamps :false});
    return Receta;
}
