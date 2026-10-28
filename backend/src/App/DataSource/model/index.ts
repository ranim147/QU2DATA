import DataSource from "./datasource.model";
import { Project } from "../../Project/model";

DataSource.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

Project.hasMany(DataSource, {
  as: "dataSources",
  foreignKey: "projectId",
});

export {
  DataSource,
};

export default {
  DataSource,
};
