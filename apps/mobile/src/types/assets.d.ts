// Lets image files be imported. Metro turns each import into a numeric asset ID that <Image source> accepts.
declare module "*.png" {
  const assetId: number;
  export default assetId;
}

declare module "*.jpg" {
  const assetId: number;
  export default assetId;
}

declare module "*.webp" {
  const assetId: number;
  export default assetId;
}
