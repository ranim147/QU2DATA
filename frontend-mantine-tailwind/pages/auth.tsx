import Auth from "../src/components/auth";
import { withTranslations } from "../src/helpers/HOC/withTranslations";

export default function Login() {
  return <Auth />;
}

export const getStaticProps = withTranslations(undefined, [
  "login",
  "singUp",
  "common",
]);
