import { Model, ModelCtor } from "sequelize";

type ModelStatic<
  TAttributes = any,
  TCreationAttributes = TAttributes
> = ModelCtor<Model<TAttributes, TCreationAttributes>>;

export interface FetchDataOptions<TModel extends ModelStatic> {
  model: TModel;
  requestedFields?: any;
  where?: any;
  many?: Boolean;
}

export interface ExtractData<TModel extends ModelStatic> {
  model: TModel;
  requestedFields: any;
}
