const { Sequelize, DataTypes } = require('sequelize');

module.exports=(sequelize) => {
    const Usuario = sequelize.define('Usuario',{
        correo :{
            type: DataTypes.STRING,
            allownull:false,
        },
        contrasenya:{
            type:DataTypes.STRING,
            allownull:false,
        },

    },{timestamps :false});
    return Usuario;
}
