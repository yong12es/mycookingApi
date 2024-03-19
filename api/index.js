const express = require('express');
const Sequelize = require("sequelize");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const port = 9098;
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
IngredientesModel.belongsToMany(RecetasModel, { 
    through: 'cantidad',
    timestamps: false 
});
RecetasModel.belongsToMany(IngredientesModel, { 
    through: 'cantidad',
    timestamps: false 
});

//sincronizar el modelo de datos con la base de datos 
sequelize.sync({force: false})
.then(() => {
    console.log("Sincronizado")
}) .catch (error => {
console.log(error)
})

//Parte de seguridad
app.get('/', (req, res) => { 
    res.send({ok: true, resultado: "Bienvenido a la ruta de inicio"}); 
   }); 

app.post('/login', async (req, res) => {
    try {
        const { correo, contrasenya } = req.body;

        const existeUsuario = await UsuarioModel.findOne({ where: { correo } });

        if (!existeUsuario) {
            return res.status(401).json({ ok: false, error: 'Usuario no encontrado' });
        }

        const hashedPassword = crypto.createHash('sha256').update(contrasenya).digest('hex');

        if (existeUsuario.contrasenya !== hashedPassword) {
            return res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
        }

        res.send({
            ok: true,
            message: 'Sesión iniciada correctamente',
            token: generarToken(existeUsuario.correo, existeUsuario.rol)
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({
            ok: false,
            message: 'Error al iniciar sesión'
        });
    }
});

const protegerRuta = (rol) => {
    return async (req, res, next) => {
        const token = req.headers['authorization'];

        if (token) {
            try {
                const resultado = validarToken(token);
                
                if (resultado && (rol === "" || rol === resultado.rol)) {
                    // Si el token es válido y el rol coincide, se permite el acceso
                    next();
                } else {
                    res.status(401).json({ ok: false, error: "Usuario no autorizado" });
                }
            } catch (error) {
                // Si hay un error al verificar el token, se envía un mensaje de error
                res.status(401).json({ ok: false, error: "Token no válido" });
            }
        } else {
            // Si no hay token en los headers, se envía un mensaje de error
            res.status(401).json({ ok: false, error: "Token no proporcionado" });
        }
    };
};
app.get('/protegido',protegerRuta(''), (req, res) => { 
    res.send({ok: true, resultado: "Bienvenido a la zona protegida"}); 
   });

let generarToken = (login, rol) => {
    const secreto = 'Prueba123@';
    return jwt.sign({ login: login, rol: rol }, secreto, { expiresIn: "4 hours" });
};
let validarToken = (token) => {
    const secreto = 'Prueba123@';
    try {
        let resultado = jwt.verify(token, secreto);
        return resultado;
    } catch (e) {
        return null;
    }
};

app.post('/register', async (req, res) => {
    try {
        const { correo, contrasenya } = req.body;

        // Verificar si el usuario ya está registrado
        const usuarioExistente = await UsuarioModel.findOne({ where: { correo } });
        if (usuarioExistente) {
            return res.status(400).json({ ok: false, error: 'El usuario ya está registrado' });
        }

        // Hash de la contraseña antes de guardarla en la base de datos
        const hashedPassword = crypto.createHash('sha256').update(contrasenya).digest('hex');

        // Crear un nuevo usuario en la base de datos
        const nuevoUsuario = await UsuarioModel.create({
            correo: correo,
            contrasenya: hashedPassword
        });

        // Generar y enviar el token JWT para el nuevo usuario
        const token = generarToken(nuevoUsuario.correo, nuevoUsuario.rol);
        
        res.status(201).json({ ok: true, token });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ ok: false, error: 'Error al registrar usuario' });
    }
});

//Servicios Pais GET
app.get('/paises', protegerRuta(""), (req, res) => {
    PaisModel.findAll().then(pais => {
        res.status(200).json({ ok: true, pais: pais });
    }).catch(error => {
        res.status(500).json({ ok: false, error: "Error retrieving paises" });
    });
});
//Get buscar pais espefifico por id
app.get('/paises/:id', protegerRuta(""), async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar el país por su ID
        const pais = await PaisModel.findByPk(id);

        if (!pais) {
            return res.status(404).json({ ok: false, error: 'País no encontrado' });
        }

        res.status(200).json({ ok: true, pais });
    } catch (error) {
        console.error('Error al buscar el país:', error);
        res.status(500).json({ ok: false, error: 'Error al buscar el país' });
    }
});
//GET para buscar paises por continente
app.get('/paises/continente/:continente', protegerRuta(""), async (req, res) => {
    try {
        const { continente } = req.params;

        // Buscar países por continente
        const paises = await PaisModel.findAll({ where: { continente } });

        if (!paises || paises.length === 0) {
            return res.status(404).json({ ok: false, error: 'No se encontraron países para el continente especificado' });
        }

        res.status(200).json({ ok: true, paises });
    } catch (error) {
        console.error('Error al buscar países por continente:', error);
        res.status(500).json({ ok: false, error: 'Error al buscar países por continente' });
    }
});


// Servicio POST para agregar un nuevo país
app.post('/paises', protegerRuta(""), async (req, res) => {
    try {
        const { nombre, continente } = req.body;

        // Crear el país en la base de datos
        const nuevoPais = await PaisModel.create({
            nombre: nombre,
            continente: continente
        });

        res.status(201).json({ ok: true, pais: nuevoPais });
    } catch (error) {
        console.error('Error al crear un nuevo país:', error);
        res.status(500).json({ ok: false, error: 'Error al crear un nuevo país' });
    }
});
//PUT modificar paises
app.put('/paises/:id', protegerRuta(""), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, continente } = req.body;

        // Buscar el país por su ID
        const pais = await PaisModel.findByPk(id);

        if (!pais) {
            return res.status(404).json({ ok: false, error: 'País no encontrado' });
        }

        // Actualizar los datos del país
        pais.nombre = nombre;
        pais.continente = continente;
        await pais.save();

        res.status(200).json({ ok: true, pais });
    } catch (error) {
        console.error('Error al actualizar el país:', error);
        res.status(500).json({ ok: false, error: 'Error al actualizar el país' });
    }
});
//DELETE
app.delete('/paises/:id', protegerRuta(""), async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar el país por su ID y eliminarlo
        const pais = await PaisModel.findByPk(id);

        if (!pais) {
            return res.status(404).json({ ok: false, error: 'País no encontrado' });
        }

        await pais.destroy();

        res.status(200).json({ ok: true, message: 'País eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el país:', error);
        res.status(500).json({ ok: false, error: 'Error al eliminar el país' });
    }
});

app.get('/recetas', protegerRuta(""), async (req, res) => {
    try {
        const recetas = await RecetasModel.findAll();
        res.status(200).json({ ok: true, recetas });
    } catch (error) {
        console.error('Error al obtener las recetas:', error);
        res.status(500).json({ ok: false, error: 'Error al obtener las recetas' });
    }
});

app.get('/recetas/:nombre', protegerRuta(""), async (req, res) => {
    try {
        const { nombre } = req.params;
        const receta = await RecetasModel.findOne({ where: { nombre } });

        if (!receta) {
            return res.status(404).json({ ok: false, error: 'Receta no encontrada' });
        }

        res.status(200).json({ ok: true, receta });
    } catch (error) {
        console.error('Error al obtener la receta:', error);
        res.status(500).json({ ok: false, error: 'Error al obtener la receta' });
    }
});


app.post('/recetas', protegerRuta(""), async (req, res) => {
    try {
        const { nombre, descripcion, instrucciones, imagen } = req.body;

        const nuevaReceta = await RecetasModel.create({
            nombre,
            descripcion,
            instrucciones,
            imagen
        });

        res.status(201).json({ ok: true, receta: nuevaReceta });
    } catch (error) {
        console.error('Error al crear una nueva receta:', error);
        res.status(500).json({ ok: false, error: 'Error al crear una nueva receta' });
    }
});
app.put('/recetas/:id', protegerRuta(""), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, instrucciones, imagen } = req.body;

        const receta = await RecetasModel.findByPk(id);

        if (!receta) {
            return res.status(404).json({ ok: false, error: 'Receta no encontrada' });
        }

        receta.nombre = nombre;
        receta.descripcion = descripcion;
        receta.instrucciones = instrucciones;
        receta.imagen = imagen;
        await receta.save();

        res.status(200).json({ ok: true, receta });
    } catch (error) {
        console.error('Error al actualizar la receta:', error);
        res.status(500).json({ ok: false, error: 'Error al actualizar la receta' });
    }
});
app.put('/recetas/:nombre', protegerRuta(""), async (req, res) => {
    try {
        const { nombre } = req.params;
        const { descripcion, instrucciones, imagen } = req.body;

        // Buscar la receta por su nombre
        let receta = await RecetasModel.findOne({ where: { nombre } });

        if (!receta) {
            return res.status(404).json({ ok: false, error: 'Receta no encontrada' });
        }

        // Actualizar los campos de la receta
        receta.descripcion = descripcion;
        receta.instrucciones = instrucciones;
        receta.imagen = imagen;
        
        // Guardar los cambios en la base de datos
        await receta.save();

        res.status(200).json({ ok: true, receta });
    } catch (error) {
        console.error('Error al actualizar la receta:', error);
        res.status(500).json({ ok: false, error: 'Error al actualizar la receta' });
    }
});

app.delete('/recetas/:id', protegerRuta(""), async (req, res) => {
    try {
        const { id } = req.params;

        const receta = await RecetasModel.findByPk(id);

        if (!receta) {
            return res.status(404).json({ ok: false, error: 'Receta no encontrada' });
        }

        await receta.destroy();

        res.status(200).json({ ok: true, message: 'Receta eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar la receta:', error);
        res.status(500).json({ ok: false, error: 'Error al eliminar la receta' });
    }
});

// Servicio GET para obtener todos los ingredientes
app.get('/ingredientes', protegerRuta(""), async (req, res) => {
    try {
        const ingredientes = await IngredientesModel.findAll();
        res.status(200).json({ ok: true, ingredientes });
    } catch (error) {
        console.error('Error al obtener los ingredientes:', error);
        res.status(500).json({ ok: false, error: 'Error al obtener los ingredientes' });
    }
});

app.get('/ingredientes/:id', protegerRuta(""), async (req, res) => {
    try {
        const { id } = req.params;
        const ingrediente = await IngredientesModel.findByPk(id);

        if (!ingrediente) {
            return res.status(404).json({ ok: false, error: 'Ingrediente no encontrado' });
        }

        res.status(200).json({ ok: true, ingrediente });
    } catch (error) {
        console.error('Error al obtener el ingrediente:', error);
        res.status(500).json({ ok: false, error: 'Error al obtener el ingrediente' });
    }
});

app.post('/ingredientes', protegerRuta(""), async (req, res) => {
    try {
        const { nombre } = req.body;

        const nuevoIngrediente = await IngredientesModel.create({
            nombre
        });

        res.status(201).json({ ok: true, ingrediente: nuevoIngrediente });
    } catch (error) {
        console.error('Error al crear un nuevo ingrediente:', error);
        res.status(500).json({ ok: false, error: 'Error al crear un nuevo ingrediente' });
    }
});

app.put('/ingredientes/:id', protegerRuta(""), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;

        const ingrediente = await IngredientesModel.findByPk(id);

        if (!ingrediente) {
            return res.status(404).json({ ok: false, error: 'Ingrediente no encontrado' });
        }

        ingrediente.nombre = nombre;
        await ingrediente.save();

        res.status(200).json({ ok: true, ingrediente });
    } catch (error) {
        console.error('Error al actualizar el ingrediente:', error);
        res.status(500).json({ ok: false, error: 'Error al actualizar el ingrediente' });
    }
});

app.delete('/ingredientes/:id', protegerRuta(""), async (req, res) => {
    try {
        const { id } = req.params;

        const ingrediente = await IngredientesModel.findByPk(id);

        if (!ingrediente) {
            return res.status(404).json({ ok: false, error: 'Ingrediente no encontrado' });
        }

        await ingrediente.destroy();

        res.status(200).json({ ok: true, message: 'Ingrediente eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el ingrediente:', error);
        res.status(500).json({ ok: false, error: 'Error al eliminar el ingrediente' });
    }
});

app.get('/talleres', protegerRuta(""), async (req, res) => {
    try {
        const talleres = await TalleresModel.findAll();
        res.status(200).json({ ok: true, talleres });
    } catch (error) {
        console.error('Error al obtener los talleres:', error);
        res.status(500).json({ ok: false, error: 'Error al obtener los talleres' });
    }
});

app.get('/talleres/:id', protegerRuta(""), async (req, res) => {
    try {
        const { id } = req.params;
        const taller = await TalleresModel.findByPk(id);

        if (!taller) {
            return res.status(404).json({ ok: false, error: 'Taller no encontrado' });
        }

        res.status(200).json({ ok: true, taller });
    } catch (error) {
        console.error('Error al obtener el taller:', error);
        res.status(500).json({ ok: false, error: 'Error al obtener el taller' });
    }
});

app.post('/talleres', protegerRuta(""), async (req, res) => {
    try {
        const { nombre, fecha, duracion, descripcion } = req.body;

        const nuevoTaller = await TalleresModel.create({
            nombre,
            fecha,
            duracion,
            descripcion
        });

        res.status(201).json({ ok: true, taller: nuevoTaller });
    } catch (error) {
        console.error('Error al crear un nuevo taller:', error);
        res.status(500).json({ ok: false, error: 'Error al crear un nuevo taller' });
    }
});

app.put('/talleres/:id', protegerRuta(""), async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, fecha, duracion, descripcion } = req.body;

        const taller = await TalleresModel.findByPk(id);

        if (!taller) {
            return res.status(404).json({ ok: false, error: 'Taller no encontrado' });
        }

        taller.nombre = nombre;
        taller.fecha = fecha;
        taller.duracion = duracion;
        taller.descripcion = descripcion;
        await taller.save();

        res.status(200).json({ ok: true, taller });
    } catch (error) {
        console.error('Error al actualizar el taller:', error);
        res.status(500).json({ ok: false, error: 'Error al actualizar el taller' });
    }
});

app.delete('/talleres/:id', protegerRuta(""), async (req, res) => {
    try {
        const { id } = req.params;

        const taller = await TalleresModel.findByPk(id);

        if (!taller) {
            return res.status(404).json({ ok: false, error: 'Taller no encontrado' });
        }

        await taller.destroy();

        res.status(200).json({ ok: true, message: 'Taller eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar el taller:', error);
        res.status(500).json({ ok: false, error: 'Error al eliminar el taller' });
    }
});

