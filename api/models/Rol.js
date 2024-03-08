const { Sequelize, DataTypes } = require('sequelize');

module.exports=(sequelize) => {
    const Rol = sequelize.define('Rol',{
        tipo :{
            //Enum para definir conjunto de valor permitidos
            type: DataTypes.ENUM('admin','cliente'),
            allownull:false,
        },
    },{timestamps :false});
    return Rol;
}
