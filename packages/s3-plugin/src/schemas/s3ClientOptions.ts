export interface s3ClientOptions {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    s3Acl?: string;
    endpoint?: string;
    region?: string;
    signatureVersion?: string;
}
