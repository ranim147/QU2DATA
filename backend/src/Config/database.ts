import { Sequelize } from "sequelize";
import * as path from "path";
import * as fs from "fs";
const configPath = path.join(__dirname, "config.json");
const configData = fs.readFileSync(configPath, "utf-8");
const configVariables = JSON.parse(configData);

const {
  db_host,
  db_name,
  db_user,
  db_password,
  db_dialect,
  db_port,
  db_dialectOptions,
  db_define,
} = configVariables;
const sequelize = new Sequelize(db_name, db_user, db_password, {
  host: db_host,
  dialect: db_dialect,
  port: db_port,
  dialectOptions: db_dialectOptions,
  define: db_define,
  logging: true,
});
export async function initializeDB() {
  try {
    // Make sure every model's table exists before running the seed —
    // in Postgres the multi-statement seed aborts entirely if one is missing.
    await sequelize.sync();

    // Une DataSource peut générer plusieurs fichiers. Cette contrainte
    // provenait de l'ancienne relation one-to-one et peut encore exister
    // dans une base déjà créée, même après sa suppression du modèle.
    if (sequelize.getDialect() === "postgres") {
      await sequelize.query(`
        ALTER TABLE "v1_files"
        DROP CONSTRAINT IF EXISTS "v1_files_data_source_id_key"
      `);
    }

    const sqlValuesPath = path.join(__dirname, "init_values.sql");
    const sqlValues = fs.readFileSync(sqlValuesPath, "utf8");
    await sequelize.query(sqlValues);
    console.log("Initial values inserted successfully...");
    console.log("----------------------------------------");
    console.log("Database initialization completed successfully.");
  } catch (error) {
    console.error("Error initializing the database:", error);
  }
}

export { sequelize };
