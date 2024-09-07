export interface Environment {
  nodeEnv: string;
  dbUrl: string;
  baseUrl: string;
  awsSecretKey: string;
  awsAccessKey: string;
  region: string;
  s3Bucket: string;
  s3Url: string;
}

export function env(): Environment {
  return {
    nodeEnv: process.env.NODE_ENV,
    dbUrl:
      process.env.DB_URL ??
      "mongodb+srv://myschoollifeinfo:zpKNgvRsgmglWqpw@cluster0.wj4nnds.mongodb.net/school",
    baseUrl: process.env.BASE_URL ?? "",
    awsSecretKey: process.env.aws_secret_key ?? "",
    awsAccessKey: process.env.aws_access_key ?? "",
    region: process.env.region ?? "us-east-1",
    s3Bucket: process.env.s3_bucket ?? "sugamaya",
    s3Url: process.env.S3URL,
  };
}
