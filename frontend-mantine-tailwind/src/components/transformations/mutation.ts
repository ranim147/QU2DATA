import { gql } from "@apollo/client";

export const DELETE_TRANSFORMATION = gql`
  mutation DeleteTransformation($id: ID!) {
    deleteTransformation(id: $id) {
      success
      message
    }
  }
`;

const TRANSFORMATION_RESPONSE_FIELDS = gql`
  fragment TransformationResponseFields on TransformationResponse {
    success
    message
    transformation {
      id
      name
      type
      parameters
      status
      errorMessage
      fileId
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_TRANSFORMATION = gql`
  mutation CreateImputationTransformation(
    $name: String!
    $type: TransformationType!
    $parameters: JSON!
    $fileId: ID!
  ) {
    createTransformation(
      name: $name
      type: $type
      parameters: $parameters
      fileId: $fileId
    ) {
      ...TransformationResponseFields
    }
  }
  ${TRANSFORMATION_RESPONSE_FIELDS}
`;

export const PREVIEW_TRANSFORMATION = gql`
  mutation PreviewImputationTransformation($transformationId: ID!) {
    previewTransformation(transformationId: $transformationId) {
      ...TransformationResponseFields
      typeCorrectionResult { column originalType newType conversionFailures preview requiresConfirmation }
    }
  }
  ${TRANSFORMATION_RESPONSE_FIELDS}
`;

export const APPLY_TRANSFORMATION = gql`
  mutation ApplyImputationTransformation($transformationId: ID!) {
    applyTransformation(transformationId: $transformationId) {
      ...TransformationResponseFields
    }
  }
  ${TRANSFORMATION_RESPONSE_FIELDS}
`;

export const CANCEL_TRANSFORMATION = gql`
  mutation CancelImputationTransformation($transformationId: ID!) {
    cancelTransformation(transformationId: $transformationId) {
      ...TransformationResponseFields
    }
  }
  ${TRANSFORMATION_RESPONSE_FIELDS}
`;

export const CREATE_DEDUPLICATION = gql`
  mutation CreateDeduplication(
    $name: String!
    $type: TransformationType!
    $parameters: JSON!
    $fileId: ID!
  ) {
    createTransformation(
      name: $name
      type: $type
      parameters: $parameters
      fileId: $fileId
    ) {
      ...TransformationResponseFields
    }
  }
  ${TRANSFORMATION_RESPONSE_FIELDS}
`;

export const EXECUTE_DEDUPLICATION = gql`
  mutation ExecuteDeduplication($transformationId: ID!) {
    previewTransformation(transformationId: $transformationId) {
      ...TransformationResponseFields
      deduplicationResult {
        subsetUsed
        keep
        preview
        rowsBefore
        rowsAfter
        rowsRemoved
        output
      }
    }
  }
  ${TRANSFORMATION_RESPONSE_FIELDS}
`;

export const CREATE_OUTLIER_TREATMENT = gql`
  mutation CreateOutlierTreatment(
    $name: String!
    $type: TransformationType!
    $parameters: JSON!
    $fileId: ID!
  ) {
    createTransformation(
      name: $name
      type: $type
      parameters: $parameters
      fileId: $fileId
    ) {
      ...TransformationResponseFields
    }
  }
  ${TRANSFORMATION_RESPONSE_FIELDS}
`;

export const EXECUTE_OUTLIER_TREATMENT = gql`
  mutation ExecuteOutlierTreatment($transformationId: ID!) {
    previewTransformation(transformationId: $transformationId) {
      ...TransformationResponseFields
      outlierTreatmentResult {
        outliersTreated
        treatmentPreview
        rows
        currentPreview
      }
    }
  }
  ${TRANSFORMATION_RESPONSE_FIELDS}
`;
