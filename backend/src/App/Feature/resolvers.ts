import {
  deleteFeature,
  getFeatures,
  toggleVisibility,
  updateFeature,
  correctFeatureType,
} from "./service";
import {
  GetFeaturesOptions,
  updateFeatureInput,
  correctFeatureTypeInput,
} from "./types";
import {
  updateFeatureInputSchema,
  correctFeatureTypeInputSchema,
} from "./validators";
import { parseDataValidation } from "../../Helpers/GeneralHelpers";
import { ContextWithUser } from "../../Directives/auth";

const resolvers = {
  Mutation: {
    updateFeature: async (_: any, args: updateFeatureInput) => {
      const result = parseDataValidation(args, updateFeatureInputSchema);
      if (result !== true) {
        return { ...result, feature: null };
      }
      return await updateFeature(args);
    },

    toggleFeatureVisibility: async (
      _: any,
      { featureId }: { featureId: string }
    ) => {
      return await toggleVisibility(featureId);
    },

    deleteFeature: async (_: any, { featureId }: { featureId: string }) => {
      return await deleteFeature(featureId);
    },

    correctFeatureType: async (
      _: any,
      args: correctFeatureTypeInput
    ) => {
      const result = parseDataValidation(args, correctFeatureTypeInputSchema);
      if (result !== true) {
        return { ...result, feature: null, conversionFailures: null };
      }
      return await correctFeatureType(args.featureId, args.targetType);
    },
  },

  Query: {
    getFeatures: async (
      _: any,
      args: GetFeaturesOptions,
      context: ContextWithUser
    ) => {
      return await getFeatures(args);
    },
  },
};

export default resolvers;