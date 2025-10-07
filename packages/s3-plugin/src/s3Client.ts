import AWS from "aws-sdk";
import S3, { ManagedUpload, ObjectIdentifierList } from "aws-sdk/clients/s3";
import https from "https";

import { ListObjectResponse } from "./schemas/ListObjectsResponse";
import { s3ClientOptions } from "./schemas/s3ClientOptions";

class S3Client {
    private s3Bucket: string;
    private awsAccessKeyId: string;
    private awsSecretAccessKey: string;
    private s3Endpoint: string | undefined;
    private s3Acl: string | undefined;
    public s3: AWS.S3;

    constructor(options: s3ClientOptions) {
        this.s3Bucket = options.bucket;
        this.awsAccessKeyId = options.accessKeyId;
        this.awsSecretAccessKey = options.secretAccessKey;
        this.s3Endpoint = options.endpoint;
        this.s3Acl = options.s3Acl;

        this.s3 = new AWS.S3({
            accessKeyId: this.awsAccessKeyId,
            secretAccessKey: this.awsSecretAccessKey,
            sslEnabled: true,
            httpOptions: {
                agent: new https.Agent({ keepAlive: true }),
            },
            // @ts-ignore
            endpoint: this.s3Endpoint ? new AWS.Endpoint(this.s3Endpoint) : undefined,
            signatureVersion: options.signatureVersion,
            region: options.region,
        });
    }

    async checkIfExists(fileName: string) {
        const params = {
            Bucket: this.s3Bucket,
            Key: fileName,
        };
        try {
            await this.s3.headObject(params).promise();
            return true;
        } catch (err) {
            return false;
        }
    }

    async uploadFile(fileName: string, data: Buffer, mime?: string): Promise<ManagedUpload.SendData> {
        const params: S3.Types.PutObjectRequest = {
            Bucket: this.s3Bucket,
            Key: fileName,
            ContentType: mime,
            Body: data,
            ACL: this.s3Acl,
        };
        return this.s3.upload(params).promise();
    }

    async getSignedUrl(key: string, expires = 60 * 1000) {
        const params = {
            Bucket: this.s3Bucket,
            Key: key,
            Expires: expires / 1000, // Note: AWS sets expires in seconds
        };

        return new Promise((resolve, reject) =>
            this.s3.getSignedUrl("getObject", params, (err, url) => {
                if (err) {
                    reject(err);
                }
                resolve(url);
            })
        );
    }

    async deleteObject(file: string, version?: string) {
        const params = {
            Bucket: this.s3Bucket,
            Key: file,
            VersionId: version,
        };

        return this.s3.deleteObject(params).promise();
    }

    /**
     * Delete files from s3 bucket
     *
     * @param {Array<Object>} files
     *
     * @returns {Promise}
     */
    async deleteObjects(files: ObjectIdentifierList) {
        const params: S3.Types.DeleteObjectsRequest = {
            Bucket: this.s3Bucket,
            Delete: {
                Objects: files,
                Quiet: false,
            },
        };

        return this.s3.deleteObjects(params).promise();
    }

    async getObject(key: string) {
        try {
            const file = await this.s3.getObject({ Bucket: this.s3Bucket, Key: key }).promise();

            if (!file.Body) {
                throw new Error("Missing file body");
            }

            return {
                data: file.Body,
                mimetype: file.ContentType,
            };
        } catch (err) {
            throw `File ${key} does not exist`;
        }
    }

    async getObjects(): Promise<ListObjectResponse> {
        try {
            const { Contents } = await this.s3.listObjects({ Bucket: this.s3Bucket, MaxKeys: 2000 }).promise();

            const files: { key: string }[] = [];

            Contents?.forEach(({ Key }) => {
                if (Key) files.push({ key: Key });
            });

            return { files };
        } catch (err) {
            throw err;
        }
    }

    /**
     * This use only for unit tests
     */
    async deleteBucket() {
        try {
            await this.s3.deleteBucket({ Bucket: this.s3Bucket }).promise();
        } catch (err) {
            throw err;
        }
    }
}

export default S3Client;
