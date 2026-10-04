/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/admin/component-groups", destination: "/admin/templates", permanent: true },
      { source: "/admin/component-groups/new-group", destination: "/admin/templates/new-template", permanent: true },
      { source: "/admin/component-groups/:groupId", destination: "/admin/templates/:groupId", permanent: true },
      { source: "/component-groups/:groupId", destination: "/templates/:groupId", permanent: true },
    ];
  },
};

export default nextConfig;
