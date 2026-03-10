import Landing from "./components/Landing";

export const metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return <Landing />;
}
