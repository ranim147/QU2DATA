import { gql } from "@apollo/client";

interface EmailValidationResponse {
  success: boolean;
  message: true;
}
export interface SendEmailValidationType {
  SendEmailValidation: EmailValidationResponse;
}
export interface ValidateEmailType {
  ValidateEmail: EmailValidationResponse;
}
export const SEND_EMAIL_VALIDATION_MUTATION = gql`
  mutation Mutation {
    SendEmailValidation {
      success
      message
    }
  }
`;
export const VALIDATE_EMAIL = gql`
  mutation Mutation($token: String!) {
    ValidateEmail(token: $token) {
      success
      message
    }
  }
`;
