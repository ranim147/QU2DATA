import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export const nameSpaces = ["common"];

export function withTranslations<
  P extends { [key: string]: unknown } = { [key: string]: unknown }
>(gssp?: GetServerSideProps<P>, addedNameSpaces?: string[]) {
  return async (context: GetServerSidePropsContext) => {
    const translation = await serverSideTranslations(context.locale || "fr", [
      ...nameSpaces,
      ...(addedNameSpaces || []),
    ]);

    if (!gssp) {
      return { props: translation };
    }

    const gsspData = await gssp(context);
    if ("props" in gsspData) {
      return { ...gsspData, props: { ...translation, ...gsspData.props } };
    }

    return gsspData;
  };
}
