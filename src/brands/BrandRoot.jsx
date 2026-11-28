export default function BrandRoot({ brand, children, ...props }) {
  return (
    <div {...brand.attributes} {...props}>
      <style href={brand.styleHref} precedence="brand">{brand.css}</style>
      {children}
    </div>
  );
}
