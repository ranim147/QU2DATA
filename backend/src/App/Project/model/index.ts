import { ProjectUser } from "./projectUser.model";
import { User } from "../../User/model";
import Project from "./project.model";

// Project <-> User many-to-many via ProjectUser
Project.belongsToMany(User, {
  through: ProjectUser,
  foreignKey: "projectId",
  otherKey: "userId",
  as: "members",
});
User.belongsToMany(Project, {
  through: ProjectUser,
  foreignKey: "userId",
  otherKey: "projectId",
  as: "projects",
});


export { Project, ProjectUser };