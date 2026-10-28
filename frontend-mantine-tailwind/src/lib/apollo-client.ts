import {
  ApolloClient,
  createHttpLink,
  fromPromise,
  InMemoryCache,
  NormalizedCacheObject,
  split,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import Cookies from "universal-cookie";
import merge from "deepmerge";
import isEqual from "lodash/isEqual";
import { useMemo } from "react";
import { GetServerSidePropsContext } from "next";
import { getMainDefinition } from "@apollo/client/utilities";

const ACCESS_TOKEN_COOKIE = "quDataSenseToken";
const REFRESH_TOKEN_COOKIE = "qu2control_refresh_token";

const cookies = new Cookies();
if (!process.env.NEXT_PUBLIC_GQL_API_URL) {
  throw "GRAPHQL API IS UNDEFINED ! ";
}
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GQL_API_URL,
});
import { WebSocketLink } from "@apollo/client/link/ws";
import { SubscriptionClient } from "subscriptions-transport-ws";

const wsLink =
  typeof window !== "undefined"
    ? new WebSocketLink(
      new SubscriptionClient(process.env.NEXT_PUBLIC_GQL_WS_URL, {
        connectionParams: {
          Authorization: `Bearer ${cookies.get(ACCESS_TOKEN_COOKIE)}`,
        },
      })
    )
    : null;

// ── Token refresh helpers ────────────────────────────────────────────────────

let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

const resolvePending = (token: string | null) => {
  pendingRequests.forEach((resolve) => resolve(token));
  pendingRequests = [];
};

const fetchNewTokens = async (): Promise<string | null> => {
  const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE);
  if (!refreshToken) return null;

  try {
    const res = await fetch(process.env.NEXT_PUBLIC_GQL_API_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation RefreshToken($token: String!) {
          RefreshToken(token: $token) { success token refreshToken }
        }`,
        variables: { token: refreshToken },
      }),
    });
    const { data } = await res.json();
    if (!data?.RefreshToken?.success) return null;

    const { token: newAccess, refreshToken: newRefresh } = data.RefreshToken;
    cookies.set(ACCESS_TOKEN_COOKIE, newAccess.replace("Bearer ", ""), { path: "/" });
    cookies.set(REFRESH_TOKEN_COOKIE, newRefresh, { path: "/" });
    return newAccess;
  } catch {
    return null;
  }
};

// ── Error link — intercepts UNAUTHENTICATED, refreshes, retries ──────────────

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (typeof window === "undefined") return;

  const isUnauthenticated = graphQLErrors?.some(
    (e) => e.extensions?.code === "UNAUTHENTICATED"
  );
  if (!isUnauthenticated) return;

  if (isRefreshing) {
    // Queue this operation until the in-flight refresh completes
    return fromPromise(
      new Promise<string | null>((resolve) => pendingRequests.push(resolve))
    )
      .filter(Boolean)
      .flatMap((newToken) => {
        operation.setContext(({ headers = {} }) => ({
          headers: {
            ...headers,
            authorization: `Bearer ${(newToken as string).replace("Bearer ", "")}`,
          },
        }));
        return forward(operation);
      });
  }

  isRefreshing = true;

  return fromPromise(
    fetchNewTokens().finally(() => {
      isRefreshing = false;
    })
  ).flatMap((newToken) => {
    resolvePending(newToken);

    if (!newToken) {
      cookies.set(ACCESS_TOKEN_COOKIE, "", { expires: new Date(0), path: "/" });
      cookies.set(REFRESH_TOKEN_COOKIE, "", { expires: new Date(0), path: "/" });
      window.location.href = "/auth/";
      return forward(operation);
    }

    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        authorization: `Bearer ${newToken.replace("Bearer ", "")}`,
      },
    }));
    return forward(operation);
  });
});

// ── Auth link — injects the access token into every request ──────────────────

type AuthLinkParam = GetServerSidePropsContext["req"] | string;

const authLink = (req?: AuthLinkParam) => {
  return setContext((_, context) => {
    let token = null;
    if (typeof window !== "undefined") {
      token = cookies.get(ACCESS_TOKEN_COOKIE) || null;
    } else if (req) {
      if (typeof req === "string") {
        token = req;
      } else {
        const serverCookies = new Cookies(req.headers.cookie);
        token = serverCookies.get(ACCESS_TOKEN_COOKIE) || null;
      }
    }
    if (!token) return context;
    return {
      ...context,
      headers: {
        ...(context.headers || {}),
        authorization: `Bearer ${token}`,
      },
    };
  });
};

// ── Link chain ────────────────────────────────────────────────────────────────

const splitLink = (req?: AuthLinkParam) =>
  typeof window !== "undefined"
    ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      errorLink.concat(authLink(req).concat(httpLink))
    )
    : authLink(req).concat(httpLink);

// ── Apollo client setup ───────────────────────────────────────────────────────

export const APOLLO_STATE_PROP_NAME = "__APOLLO_STATE__";
let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

const client = new ApolloClient({
  link: splitLink(),
  cache: new InMemoryCache({ addTypename: true }),
  ssrMode: true,
});

export default client;

function createApolloClient(req?: AuthLinkParam) {
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: splitLink(req),
    cache: new InMemoryCache({ addTypename: true }),
  });
}

export function initializeApollo(
  initialState: NormalizedCacheObject | null = null,
  req?: AuthLinkParam
) {
  const _apolloClient = apolloClient ?? createApolloClient(req);

  if (initialState) {
    const existingCache = _apolloClient.extract();
    const data = merge(initialState, existingCache, {
      arrayMerge: (destinationArray, sourceArray) => [
        ...sourceArray,
        ...destinationArray.filter((d) =>
          sourceArray.every((s) => !isEqual(d, s))
        ),
      ],
    });
    _apolloClient.cache.restore(data);
  }

  if (typeof window === "undefined") return _apolloClient;

  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function addApolloState(
  client: ApolloClient<NormalizedCacheObject>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageProps: any
) {
  if (typeof pageProps?.props !== "undefined") {
    pageProps.props[APOLLO_STATE_PROP_NAME] = client.cache.extract();
  }
  return pageProps;
}

export function useApollo(pageProps: unknown) {
  const state = pageProps[APOLLO_STATE_PROP_NAME];
  const store = useMemo(() => initializeApollo(state), [state]);
  return store;
}
