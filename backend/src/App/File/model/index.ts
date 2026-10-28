import File from "./file.model";
import { DataSource } from "../../DataSource/model";
import { Project } from "../../Project/model";

DataSource.hasMany(File, {
  as: "files",
  foreignKey: "dataSourceId",
});

File.belongsTo(DataSource, {
  as: "dataSource",
  foreignKey: "dataSourceId",
});

Project.hasMany(File, {
  as: "files",
  foreignKey: "projectId",
});

File.belongsTo(Project, {
  as: "project",
  foreignKey: "projectId",
});

export { File };
