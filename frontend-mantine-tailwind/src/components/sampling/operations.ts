import { gql } from "@apollo/client";

export const EXECUTE_SIMPLE_RANDOM_SAMPLING = gql`
  mutation ExecuteSimpleRandomSampling($input: SimpleRandomSamplingInput!) {
    executeSimpleRandomSampling(input: $input) {
      success
      message
      data {
        fileId
        source
        output
        hasPreview
        method
        totalRows
        sampleSize
        sizeMode
        sizeValue
        seed
        confidence
        selectedIndices
        rows
        columns
        preview
      }
    }
  }
`;

const STANDARD_FIELDS = `
  fileId source output hasPreview method totalRows sampleSize seed confidence
  selectedIndices rows columns preview
`;

export const GET_SAMPLING_COLUMNS = gql`
  query GetSamplingColumns($fileId: ID!) {
    getCurrentDataset(fileId: $fileId, limit: 1) {
      success
      message
      columns
      rowCount
    }
  }
`;

export const GET_SAMPLING_FILE = gql`
  query GetSamplingFile($filter: FileFilterInput) {
    getFiles(filter: $filter, page: 1, limit: 1) {
      rows {
        id
        name
      }
    }
  }
`;

export const EXECUTE_SYSTEMATIC_SAMPLING = gql`
  mutation ExecuteSystematicSampling($input: SystematicSamplingInput!) {
    executeSystematicSampling(input: $input) {
      success
      message
      data {
        ${STANDARD_FIELDS}
        sizeMode
        sizeValue
        k
        offset
      }
    }
  }
`;

export const EXECUTE_BOOTSTRAP_SAMPLING = gql`
  mutation ExecuteBootstrapSampling($input: BootstrapSamplingInput!) {
    executeBootstrapSampling(input: $input) {
      success
      message
      data {
        fileId
        message
        rowsOriginal
        rowsSampled
        marginOfError
        confidenceLevel
        preview
      }
    }
  }
`;

export const EXECUTE_STRATIFIED_SAMPLING = gql`
  mutation ExecuteStratifiedSampling($input: StratifiedSamplingInput!) {
    executeStratifiedSampling(input: $input) {
      success
      message
      data {
        fileId
        message
        strateColumn
        modalities
        rowsOriginal
        rowsSampled
        marginOfError
        confidenceLevel
        preview
      }
    }
  }
`;

export const EXECUTE_QUOTA_SAMPLING = gql`
  mutation ExecuteQuotaSampling($input: QuotaSamplingInput!) {
    executeQuotaSampling(input: $input) {
      success
      message
      data {
        ${STANDARD_FIELDS}
        quotaColumns
        quotaResults {
          values
          requested
          available
          selected
          underfilled
        }
      }
    }
  }
`;
