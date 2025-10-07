export interface s3PluginOptions {
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    s3Acl?: string;
    endpoint?: string;
    maxFileSize?: number;
    enableUpload: boolean;
    uploadUrl?: string;
    uploadPermissionRequired?: string;
    signatureVersion?: string;
    region?: string;
}
