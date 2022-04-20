import { badRequest, FlinkApp, FlinkPlugin, HttpMethod, internalServerError, log, unauthorized } from "@flink-app/flink";
import { s3PluginOptions } from "./schemas/s3PluginOptions";
export * from "./s3PluginContext";
import S3Client from "./s3Client";
import expressFileupload from "express-fileupload";
import { UploadedFile } from "express-fileupload";
import * as uuid from "uuid";
import mime from "mime-types";

export const s3Plugin = (options: s3PluginOptions): FlinkPlugin => {
    const s3Client = new S3Client({
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
        bucket: options.bucket,
        s3Acl: options.s3Acl,
        endpoint: options.endpoint,
    });

    return {
        id: "s3Plugin",
        init: (app) => init(app, options),
        ctx: {
            s3Client,
        },
    };
};

function init(app: FlinkApp<any>, options: s3PluginOptions) {
    if (options.enableUpload) {
        let maxFileSize = options.maxFileSize || 10;
        app.expressApp!.use(
            expressFileupload({
                limits: { fileSize: maxFileSize * 1024 * 1024 },
                abortOnLimit: true,
            })
        );

        let uploadUrl = options.uploadUrl || "/file-upload";

        app.expressApp!.post(uploadUrl, async (req, res) => {
            if (options.uploadPermissionRequired) {
                let authenticated = (await app.ctx.auth?.authenticateRequest(req, [options.uploadPermissionRequired])) as boolean;
                if (!authenticated) {
                    res.status(500).json({
                        status: 500,
                        error: { id: uuid.v4(), title: "Permission denied", detail: "Permission denied to this endpoint", code: "permissionDenied" },
                    });
                    return;
                }
            }
            const file = req.files?.file as UploadedFile;
            if (!file) {
                res.status(500).json({ status: 500, error: { id: uuid.v4(), title: "No file", detail: "No file specified", code: "badRequest" } });
                return;
            }

            const { path } = req.query;

            const s3Client = app.ctx.plugins.s3Plugin.s3Client as S3Client;
            if (s3Client == null) {
                res.status(500).json({
                    status: 500,
                    error: { id: uuid.v4(), title: "Plugin not initialized", detail: "S3 Client not initialized", code: "badRequest" },
                });
                return;
            }

            const fileSplit = file.name.split(".");
            const fileExt = fileSplit.length > 1 ? fileSplit[fileSplit.length - 1] : mime.extension(file.mimetype);
            const filename = formatS3Path(path ? (path as string) : "") + uuid.v4() + "." + fileExt;
            try {
                const uploadData = await s3Client.uploadFile(filename, file.data, file.mimetype);
                res.json({
                    url: uploadData.Location,
                });
            } catch (ex) {
                res.status(500).json({
                    status: 500,
                    error: { id: uuid.v4(), title: "Internal server error", detail: "Internal server errror while communicating with S3", code: "badRequest" },
                });
            }
        });
        log.info("Registered route POST " + uploadUrl);
    }
}

function formatS3Path(path: string) {
    path = path.trim();

    if (path) {
        if (path.startsWith("/")) {
            path = path.substr(1);
        }

        if (!path.endsWith("/")) {
            path = path + "/";
        }
    }
    return path;
}
