import DataSourceService from "./service";

export default {
  Query: {
    dataSourceHealth: () =>
      "DataSource module OK",

    dataSources: async () => {
      return DataSourceService.listDataSources();
    },

    dataSource: async (
      _: unknown,
      args: { id: string }
    ) => {
      return DataSourceService.getDataSourceById(
        args.id
      );
    },

    dataSourceResourcesById: async (
      _: unknown,
      args: { dataSourceId: string }
    ) => {
      return DataSourceService
        .getResourcesByDataSourceId(
          args.dataSourceId
        );
    },

    previewDataSourceById: async (
      _: unknown,
      args: {
        dataSourceId: string;
        resourceName: string;
        limit?: number;
      }
    ) => {
      return DataSourceService
        .previewByDataSourceId(
          args.dataSourceId,
          args.resourceName,
          args.limit ?? 100
        );
    },
  },

  Mutation: {
    createDataSource: async (
      _: unknown,
      args: { input: any }
    ) => {
      return DataSourceService.createDataSource(
        args.input
      );
    },

    testDataSourceConnection: async (
      _: unknown,
      args: { input: any }
    ) => {
      return DataSourceService.testConnection(
        args.input
      );
    },

    testSavedDataSourceConnection: async (
      _: unknown,
      args: { dataSourceId: string }
    ) => {
      return DataSourceService
        .testSavedDataSource(
          args.dataSourceId
        );
    },

    extractDataSource: async (
      _: unknown,
      args: { input: any }
    ) => {
      return DataSourceService
        .extractDataSourceToFile(
          args.input
        );
    },
  },
};
