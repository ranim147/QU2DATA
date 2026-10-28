import express, { Application } from "express";
import { ApolloServer } from "apollo-server-express";
import { restFullRouter } from "./Routes/RestFull";
import modules from "./App";
import { makeExecutableSchema } from "@graphql-tools/schema";
import directives from "./Directives";
import { initializeDB } from "./Config/database";
import { seedWidgetTypes } from "./App/widgets/service";
import dotenv from 'dotenv';
dotenv.config();
const startServer = async () => {
  let schema = makeExecutableSchema({
    typeDefs: [modules.schema, ...directives.typeDef],
    resolvers: [...modules.resolvers],
  });

  // Apply the directive to the schema
  for (const transformer of directives.transformer) {
    if (typeof transformer !== "function") continue;
    schema = transformer(schema);
  }

  const server = new ApolloServer({
    schema,
    csrfPrevention: false,
    context: async (context) => {
      // Initiate the context to null
      return {
        ...context,
        user: null,
      };
    },
  });

  const app: Application = express();


  const port = process.env.PORT;
  if (!process.env.PORT) {
    throw new Error("YOU SHOULD CREATE ENV FILE ! WITH PORT VALUE")
  }
  app.use(express.json());

  // CORS middleware (necessary for frontend preflight OPTIONS)
  // Applied before REST routes.
  const { corsMiddleware } = require("./Middleware/cors");
  app.use(corsMiddleware());

  // Define your RESTful API routes
  app.use("/api/Rest/v1", restFullRouter);
  app.use(express.static("src/public"));


  // Apply Apollo Server middleware to the "/graphql" path
 //await initializeDB();
 await seedWidgetTypes();
 await server.start();

  server.applyMiddleware({
    app,
    cors: true,
    bodyParserConfig: true,
    path: "/graphql",
  });
  app.use(function (req, res, next) {
    res.setHeader("X-Powered-By", "GAMING APP");
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, authorization"
    );
    next();
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(
      `GraphQL Playground is available at http://localhost:${port}/graphql`
    );
  });
};

// Start the server
startServer().catch((error) => {
  console.error("Error starting the server:", error);
});
