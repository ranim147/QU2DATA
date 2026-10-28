import { sequelize } from "../../Config/database";
export function getIncludesAndRequestedFields(params: any) {
  const include = [];
  let requestedFields = params;
  // Loop through requested fields to find associations
  Object.keys(requestedFields).forEach((field) => {
    const model = sequelize.models[field];
    if (model) {
      const associations = model.associations;
      if (associations && Object.keys(associations).length > 0) {
        include.push({ model: model });
      }
      delete requestedFields[field];
    }
  });
  return {
    requestedFields,
    include,
  };
}
