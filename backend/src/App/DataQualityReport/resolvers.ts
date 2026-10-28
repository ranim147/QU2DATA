import { ApolloError } from "apollo-server-express";
import {
  generateDataQualityReport,
  getLatestDataQualityReport,
} from "./service";
import { ContextWithUser } from "../../Directives/auth";

const resolvers = {
  Mutation: {
    // Reçoit fileId depuis le frontend, appelle notre fonction 6
    // (celle qui orchestre tous les appels FastAPI + calculs), et
    // renvoie le résultat au format { success, message, report }
    generateDataQualityReport: async (
      _: any,
      { fileId }: { fileId: string },
      context: ContextWithUser
    ) => {
      try {
        const report = await generateDataQualityReport(fileId);
        return {
          success: true,
          message: "DATA QUALITY REPORT GENERATED",
          report,
        };
      } catch (error: any) {
        // Si generateDataQualityReport a levé une ApolloError (ex: FILE NOT FOUND),
        // on renvoie son message proprement plutôt que de faire planter la requête
        if (error instanceof ApolloError) {
          return {
            success: false,
            message: error.message,
            report: null,
          };
        }
        // Erreur inattendue (ex: FastAPI injoignable) : on la relance,
        // Apollo Server la transformera en erreur GraphQL générique
        throw error;
      }
    },
  },

  Query: {
    // Relit simplement le dernier rapport en base, sans recalculer
    getDataQualityReport: async (
      _: any,
      { fileId }: { fileId: string },
      context: ContextWithUser
    ) => {
      const report = await getLatestDataQualityReport(fileId);

      if (!report) {
        return {
          success: false,
          message: "NO REPORT FOUND FOR THIS FILE",
          report: null,
        };
      }

      return {
        success: true,
        message: "REPORT FOUND",
        report,
      };
    },
  },
};

export default resolvers;