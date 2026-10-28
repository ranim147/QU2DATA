import { appWithTranslation } from "next-i18next";
import "../styles/global.scss";
import Layout from "../src/layout";
import Head from "next/head";
import { MantineProvider } from "@mantine/core";
import config from "../config";
import { useApollo } from "../src/lib/apollo-client";
import { ApolloProvider } from "@apollo/client";
import { AuthContextProvider } from "../src/context/AuthContext";
import { ProjectFilesProvider } from "../src/context/ProjectFileContext";

const MyApp = ({ Component, pageProps }) => {
  const apolloClient = useApollo(pageProps);

  return (
    <>
      <Head>
        <title>DataSense Pro — qu2data</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>
      <ApolloProvider client={apolloClient}>
        <AuthContextProvider>
          <MantineProvider
            withCSSVariables
            withGlobalStyles
            withNormalizeCSS
            theme={{
              colorScheme: "light",
              primaryColor: "brand",
              primaryShade: 5,
              colors: {
                brand: [
                  "#f3fadf", // 0
                  "#e4f4bc", // 1
                  "#d1ec96", // 2
                  "#bae36e", // 3
                  "#9fd64d", // 4
                  "#84BF43", // 5 — primary
                  "#6ca435", // 6
                  "#548828", // 7
                  "#3d6d1c", // 8
                  "#275310", // 9
                ],
              },
            }}
          >
            <ProjectFilesProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </ProjectFilesProvider>
          </MantineProvider>
        </AuthContextProvider>
      </ApolloProvider>
    </>
  );
};

export default appWithTranslation(MyApp);
