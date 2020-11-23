import mongoose from "mongoose";
import { Clientes, Productos, Pedidos, Usuarios } from "./db";
import bcrypt from "bcrypt";
const ObjectId = mongoose.Types.ObjectId;

//Generar Token
import dotenv from "dotenv";
dotenv.config({path: "variables.env"});

import jwt from "jsonwebtoken";

const crearToken = (usuarioLogin, secreto, expiresIn) => {
    const {usuario} = usuarioLogin;

    return jwt.sign({usuario}, secreto, {expiresIn});
}


export const resolvers = {
    Query: {
        getClientes: (_, {limite, offset, vendedor}) => {
            let filtro;
            if(vendedor) {
                filtro = { vendedor: new ObjectId(vendedor) }
            }
            return Clientes.find(filtro).limit(limite).skip(offset)
        },
        getCliente: (_, {id}) => {
            return new Promise((resolve, object) => {
                Clientes.findById(id, (error, cliente) => {
                    if(error) rejects(error)
                    else resolve(cliente)
                });
            });
        },
        totalClientes: (_, {vendedor}) => {
            return new Promise((resolve, object) => {
                let filtro;
                if(vendedor) {
                    filtro = { vendedor: new ObjectId(vendedor) }
                }
                Clientes.countDocuments(filtro, (error, count) => {
                    if(error) rejects (error)
                    else resolve(count)
                })
            })
        },
        obtenerProductos: (_, {limite, offset, stock}) => {
            let filtro;
            if(stock) {
                filtro = { stock: {$gt : 0}}
            }
            return Productos.find(filtro).limit(limite).skip(offset)
        },
        obtenerProducto: (_, {id}) => {
            return new Promise((resolve, object) => {
                Productos.findById(id, (error, producto) => {
                    if(error) rejects(error)
                    else resolve(producto)
                })
            })
        },
        totalProductos: (_) => {
            return new Promise((resolve, object) => {
                Productos.countDocuments({}, (error, count) => {
                    if(error) rejects (error)
                    else resolve(count)
                })
            })
        },
        obtenerPedidos: (_, {cliente}) => {
            return new Promise((resolve, object) => {
                Pedidos.find({cliente: cliente}, (error, pedido) => {
                    if(error) rejects(error);
                    else resolve(pedido);
                })
            })
        },
        topClientes : (_) => {
            return new Promise ((resolve, object) => {
                Pedidos.aggregate([
                    {
                        $match : { estado: "COMPLETADO" }
                    },
                    {
                        $group: {
                                _id: "$cliente",
                                total: {$sum: "$total" }
                        }
                    },
                    {
                     $lookup : {
                        from: "clientes",
                        localField: "_id",
                        foreignField: "_id",
                        as: "cliente"    
                        
                       }
                    },
                    {
                       $sort: {total: -1 }
                    },
                    {
                        $limit: 10
                    }
                ], (error, resultado) => {
                    if(error) rejects(error);
                    else resolve(resultado);
                })
            })
        },
        obtenerUsuario: (_, args, {usuarioActual}) => {
            if(!usuarioActual) {
                return null;
            }
            console.log(usuarioActual);

            //Obtener el usuario actual del request del JWT verificado
            const usuario = Usuarios.findOne({usuario: usuarioActual.usuario});

            return usuario;
        },
        topVendedores : (_) => {
            return new Promise ((resolve, object) => {
                Pedidos.aggregate([
                    {
                        $match : { estado: "COMPLETADO" }
                    },
                    {
                        $group: {
                                _id: "$vendedor",
                                total: {$sum: "$total" }
                        }
                    },
                    {
                     $lookup : {
                        from: "usuarios",
                        localField: "_id",
                        foreignField: "_id",
                        as: "vendedor"    
                        
                       }
                    },
                    {
                       $sort: {total: -1 }
                    },
                    {
                        $limit: 10
                    }
                ], (error, resultado) => {
                    if(error) rejects(error);
                    else resolve(resultado);
                })
            })
        }
    },
    Mutation: {
        crearCliente : (_, {input}) => {
            const nuevoCliente = new Clientes({
                nombre : input.nombre,
                apellido : input.apellido,
                empresa : input.empresa,
                emails : input.emails,
                edad : input.edad,
                tipo : input.tipo,
                pedidos : input.pedidos,
                vendedor: input.vendedor
            });
            nuevoCliente.id = nuevoCliente._id;

            return new Promise((resolve, object) => {
                nuevoCliente.save((error) => {
                    if(error) rejects(error)
                    else resolve(nuevoCliente)
                })
            });
        },
        actualizarCliente: (_, {input}) => {
            return new Promise((resolve, object) => {
                Clientes.findOneAndUpdate({_id : input.id }, input, {new: true}, (error, cliente) => {
                if(error) rejects(error)
                else resolve(cliente)
                });
            });
        },
        eliminarCliente: (_, {id}) => {
            return new Promise((resolve, object) => {
                Clientes.findOneAndDelete({_id : id }, (error) => {
                    if(error) rejects(error)
                    else resolve("El Cliente se eliminó correctamente")
                    });
            });
        },
        nuevoProducto: (_, {input}) => {
            const nuevoProducto = new Productos({
                nombre: input.nombre,
                precio: input.precio,
                stock: input.stock
            });
            //Mongo db crea el ID que se asigna al objeto
            nuevoProducto.id = nuevoProducto._id;

            return new Promise((resolve, object) => {
                nuevoProducto.save((error) => {
                    if(error) rejects(error)
                    else resolve(nuevoProducto)
                })
            });
        },
        actualizarProducto: (_, {input}) => {
            return new Promise((resolve, producto) => {
                Productos.findOneAndUpdate({_id: input.id}, input, {new: true}, (error, producto) => {
                    if(error) rejects(error);
                    else resolve(producto)
                })
            })
        },
        eliminarProducto: (_, {id}) => {
            return new Promise((resolve, producto) => {
                Productos.findByIdAndDelete({_id: id}, (error) => {
                    if(error) rejects(error);
                    else resolve("El Producto se eliminó correctamente")
                })
            })
        },
        nuevoPedido: (_, {input}) => {
            const nuevoPedido = new Pedidos ({
                pedido: input.pedido,
                total: input.total,
                fecha: new Date(),
                cliente: input.cliente,
                estado: "PENDIENTE",
                vendedor: input.vendedor
            });

            nuevoPedido.id = nuevoPedido._id;

            return new Promise((resolve, object) => {
                
                nuevoPedido.save((error) => {
                    if(error) rejects(error)
                    else resolve(nuevoPedido)
                })
            });
        },
        actualizarEstado: (_, {input}) => {
            return new Promise((resolve, object) => {

                  //recorrer y actualizar la cantidad de productos en base al estado del pedido
                  const { estado } = input;

                  let instruccion;
                  if(estado === "COMPLETADO") {
                      instruccion = "-";
                  } else if(estado === "CANCELADO") {
                      instruccion= "+"
                  }

                  input.pedido.forEach(pedido => {
                    Productos.updateOne({_id : pedido.id}, 
                        {"$inc": 
                            {"stock": `${instruccion}${pedido.cantidad}`}
                        }, function(error) {
                            if(error) return new Error(error)
                        }
                    )
                });

                Pedidos.findOneAndUpdate({_id: input.id}, input, {new: true}, (error) => {
                    if(error) rejects(error);
                    else resolve("Se actualizó correctamente");
                })
            })
        },
        crearUsuario: async (_, { usuario, nombre, password, rol }) => {
            
            //Revisar si un usuario contiene este password
            const existeUsuario = await Usuarios.findOne({usuario})

            if(existeUsuario) {
                throw new Error("El usuario ya existe");
            }

            const nuevoUsuario = await new Usuarios({
                usuario,
                nombre,
                password,
                rol
            }).save();
            
            return "Creado Correctamente";
        },
        autentificarUsuario: async (_, {usuario, password}) => {
            
            const nombreUsuario = await Usuarios.findOne({usuario});

            if(!nombreUsuario) {
                throw new Error("Usuario no encontrado");
            }

            const passwordCorrecto = await bcrypt.compare(password, nombreUsuario.password);

            //si el password es incorrecto
            if(!passwordCorrecto) {
                throw new Error("Password Incorrecto");
            }
            
            return {
                token: crearToken(nombreUsuario, process.env.SECRETO, "1hr")
            }
        }
    }
}
