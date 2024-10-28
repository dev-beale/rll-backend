import {
    S3Client,
    PutObjectCommand,
    PutObjectCommandOutput,
  } from "@aws-sdk/client-s3";

import { S3UploadResult } from "./interfaces";
import fs from 'fs';
  
export async function uploadToS3(file : string,) : Promise<S3UploadResult>{
    const s3Client = new S3Client({region : 'us-east-1'});
    var fileStream = fs.createReadStream(file);
    fileStream.on("error", function (err: any) {
        console.log("File Error", err);
    });

    const currentTime = Date.now().toString();

    const bucketName = "gurneysbucket";
    const key = `user-uploaded-${currentTime}`;

    const s3UploadResult : S3UploadResult = {
        success: false,
        dataLocation: ""
    }

    try {
        const s3PutResult : PutObjectCommandOutput = await s3Client.send(
            new PutObjectCommand({
            Bucket: bucketName,
            Body: fileStream,
            Key: key,
            }),
        );
        s3UploadResult.success = true;
        s3UploadResult.dataLocation = `https://${bucketName}.s3.us-east-1.amazonaws.com/${key}`;
        s3UploadResult.bucket = bucketName;
        s3UploadResult.key = key;
        s3UploadResult.putObjectCommandOutput = s3PutResult;
    } catch (error) {
        s3UploadResult.success = false;
    }

    return s3UploadResult;
}