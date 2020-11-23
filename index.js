import express from "express";
//Graphql
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./data/schema";
import { resolvers } from "./data/resolvers";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({path: "variables.env"});

const app = express();

const server = new ApolloServer({
    typeDefs, 
    resolvers,
    context: async ({req}) => {
        //obtener el token del servidor
        const token = req.headers["authorization"];

        if(token !== "null") {
            try {
                // Verificar el token del front end(cliente)
                const usuarioActual = await jwt.verify(token, process.env.SECRETO);
                
                // agregamos el usuario actual al request
                req.usuarioActual = usuarioActual;

                return {
                    usuarioActual
                }
            } catch (err) {
                console.log(err);
            }
        }
    }
});

server.applyMiddleware({app});

app.listen({port: process.env.PORT || 4000 }, () => console.log(`El servidor está corriendo http://localhost:4000${server.graphqlPath}`));
