const express = require('express');
const Sequelize = require("sequelize");

const app = express();
const port = 9095;
app.use(express.json());
app.listen(port,()=>{
    console.log(`Servidor escuchando en http://localhost:${port}`)
})


//Inicializar sequelize
const sequelize = new Sequelize('mycooking', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});
sequelize.sync()
    .then(() => {
        console.log('Modelo sincronizado con la base de datos');
    })
    .catch((error) => {
        console.error('Error al sincronizar el modelo:', error);
    });

//inicializar los modelos
const IngredientesModel = require('./models/Ingredientes')(sequelize);
const PaisModel = require('./models/Pais')(sequelize);
const RecetasModel = require('./models/Recetas')(sequelize);
const TalleresModel = require('./models/Talleres')(sequelize);
const UsuarioModel = require('./models/Usuario')(sequelize);
const RolModel = require('./models/rol')(sequelize);

RolModel.belongsTo(UsuarioModel);
UsuarioModel.hasMany(RolModel);
UsuarioModel.hasMany(TalleresModel);
TalleresModel.hasMany(UsuarioModel);
PaisModel.hasMany(IngredientesModel);
IngredientesModel.belongsTo(PaisModel);

/*IngredientesModel.belongsToMany(RecetasModel, { through: 'cantidad' });
RecetasModel.belongsToMany(IngredientesModel, { through: 'cantidad' });*/
IngredientesModel.belongsToMany(RecetasModel, { 
    through: 'cantidad',
    timestamps: false 
});

RecetasModel.belongsToMany(IngredientesModel, { 
    through: 'cantidad',
    timestamps: false 
});



//sincronizar el modelo de datos con la base de datos 
sequelize.sync({force: true})
.then(() => {
    console.log("Sincronizado")
}) .catch (error => {
console.log(error)
})